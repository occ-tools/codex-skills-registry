import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";
import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";
import {
  CodexSkillSchema,
  McpConfigFileSchema,
  McpServerConfigSchema,
  PluginManifestSchema,
  type CodexSkill,
  type McpServerConfig,
  type PluginManifest,
  type TriggerType,
  type ValidationIssue,
  normalizeSkillInput,
  zodErrorToIssues
} from "./schema.js";

export interface DiscoveryDiagnostic extends ValidationIssue {
  file?: string;
}

export interface DiscoveredMcpServer {
  name: string;
  config: McpServerConfig;
  sourcePath: string;
  line?: number;
  fieldLines?: Record<string, number>;
}

export interface DiscoveredPlugin {
  manifest: PluginManifest;
  sourcePath: string;
  rootDir: string;
}

export interface DiscoveryResult {
  skills: CodexSkill[];
  mcpServers: DiscoveredMcpServer[];
  plugins: DiscoveredPlugin[];
  diagnostics: DiscoveryDiagnostic[];
}

export interface DiscoverOptions {
  cwd?: string;
  includeExamples?: boolean;
  skillRoots?: string[];
  mcpConfigPaths?: string[];
  pluginRoots?: string[];
}

interface ParsedSkillMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

const EMPTY_RESULT: DiscoveryResult = {
  skills: [],
  mcpServers: [],
  plugins: [],
  diagnostics: []
};

/**
 * Discovers Codex Skills, MCP server definitions, and plugin manifests from a
 * project tree. By default it also includes the bundled examples so a fresh
 * clone can demonstrate useful output immediately.
 *
 * @param options - Discovery roots and behavior switches.
 * @returns Normalized registry inputs plus validation diagnostics.
 */
export async function discoverProject(options: DiscoverOptions = {}): Promise<DiscoveryResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const result = cloneEmptyResult();

  const skillRoots = options.skillRoots?.map((root) => path.resolve(cwd, root)) ?? [
    ...(await findSkillRoots(cwd))
  ];
  const mcpConfigPaths = options.mcpConfigPaths?.map((file) => path.resolve(cwd, file)) ?? [
    path.join(cwd, ".codex", "config.toml")
  ];
  const pluginRoots = options.pluginRoots?.map((root) => path.resolve(cwd, root)) ?? [
    path.join(cwd, "plugins")
  ];

  if (options.includeExamples !== false) {
    skillRoots.push(path.join(cwd, "examples", ".agents", "skills"));
    mcpConfigPaths.push(path.join(cwd, "examples", ".codex", "config.toml"));
    pluginRoots.push(path.join(cwd, "examples", "plugins"));
  }

  const disabledSkills = await discoverDisabledSkillNames(unique(mcpConfigPaths));

  for (const root of unique(skillRoots)) {
    mergeResult(
      result,
      await discoverSkillsFromRoot(
        root,
        root.includes(`${path.sep}examples${path.sep}`) ? "example" : "project",
        disabledSkills
      )
    );
  }

  for (const filePath of unique(mcpConfigPaths)) {
    mergeResult(result, await discoverMcpServersFromConfig(filePath));
  }

  for (const root of unique(pluginRoots)) {
    mergeResult(result, await discoverPluginsFromRoot(root));
  }

  return result;
}

/**
 * Finds .agents/skills directories from the current working directory up to the
 * repository root or filesystem root.
 *
 * @param startDir - Directory where Codex was launched.
 * @returns Existing skill root directories.
 */
export async function findSkillRoots(startDir: string): Promise<string[]> {
  const roots: string[] = [];
  let current = path.resolve(startDir);

  while (true) {
    const candidate = path.join(current, ".agents", "skills");
    if (await pathExists(candidate)) {
      roots.push(candidate);
    }

    const parent = path.dirname(current);
    if (parent === current || (await pathExists(path.join(current, ".git")))) {
      break;
    }

    current = parent;
  }

  return roots;
}

/**
 * Loads all direct child skill directories under a Codex skill root.
 *
 * @param root - Directory containing one child folder per skill.
 * @param source - Registry source label used in normalized entries.
 * @returns Discovered skills and diagnostics.
 */
export async function discoverSkillsFromRoot(
  root: string,
  source: CodexSkill["source"] = "project",
  disabledSkills: Set<string> = new Set()
): Promise<DiscoveryResult> {
  const result = cloneEmptyResult();

  if (!(await pathExists(root))) {
    return result;
  }

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const skillDir = path.join(root, entry.name);
    if (!(entry.isDirectory() || entry.isSymbolicLink()) || !(await isDirectory(skillDir))) {
      continue;
    }

    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillFile))) {
      result.diagnostics.push({
        severity: "warning",
        path: skillDir,
        file: skillDir,
        message: "Skill directory is missing SKILL.md."
      });
      continue;
    }

    const skill = await loadSkillFromDirectory(skillDir, source);
    for (const discoveredSkill of skill.skills) {
      if (disabledSkills.has(discoveredSkill.name)) {
        result.diagnostics.push({
          severity: "warning",
          path: discoveredSkill.name,
          file: discoveredSkill.skillFile,
          message: "Skill is disabled by Codex skills.config."
        });
        continue;
      }

      result.skills.push(discoveredSkill);
    }
    result.diagnostics.push(...skill.diagnostics);
  }

  return result;
}

/**
 * Loads and normalizes a single Codex Skill directory.
 *
 * @param skillDir - Directory containing SKILL.md.
 * @param source - Registry source label.
 * @returns One skill entry or diagnostics when invalid.
 */
export async function loadSkillFromDirectory(
  skillDir: string,
  source: CodexSkill["source"] = "project"
): Promise<DiscoveryResult> {
  const result = cloneEmptyResult();
  const skillFile = path.join(skillDir, "SKILL.md");
  let sourceLines: Record<string, number> = {};

  try {
    const markdown = await readFile(skillFile, "utf8");
    const parsed = parseSkillMarkdown(markdown);
    sourceLines = collectYamlFrontmatterLines(markdown);
    const agentMetadata = await loadAgentMetadata(skillDir);
    const defaultTriggers = inferTriggers(
      `${String(parsed.frontmatter.name ?? "")} ${String(parsed.frontmatter.description ?? "")}`
    );
    const entryPoint = await detectEntryPoint(skillDir, parsed.frontmatter);

    const normalized = normalizeSkillInput(parsed.frontmatter, {
      rootDir: skillDir,
      skillFile,
      source,
      triggers: defaultTriggers,
      entryPoint,
      metadata: {
        body: parsed.body,
        agent: agentMetadata,
        sourceLines
      }
    });

    const validation = CodexSkillSchema.safeParse(normalized);
    if (!validation.success) {
      result.diagnostics.push(
        ...zodErrorToIssues(validation.error, skillFile).map((issue) => ({ ...issue, file: skillFile }))
      );
      return result;
    }

    result.skills.push(validation.data);
  } catch (error) {
    if (error instanceof ZodError) {
      result.diagnostics.push(
        ...zodErrorToIssues(error, skillFile).map((issue) => ({
          ...issue,
          file: skillFile,
          line: lineForIssuePath(issue.path, sourceLines)
        }))
      );
      return result;
    }

    result.diagnostics.push({
      severity: "error",
      path: skillFile,
      file: skillFile,
      message: error instanceof Error ? error.message : String(error)
    });
  }

  return result;
}

/**
 * Parses Codex MCP server configuration from a config.toml file.
 *
 * @param filePath - TOML file path.
 * @returns MCP server entries and diagnostics.
 */
export async function discoverMcpServersFromConfig(filePath: string): Promise<DiscoveryResult> {
  const result = cloneEmptyResult();

  if (!(await pathExists(filePath))) {
    return result;
  }

  try {
    const content = await readFile(filePath, "utf8");
    const parsed = parseToml(content);
    const validation = McpConfigFileSchema.safeParse(parsed);

    if (!validation.success) {
      result.diagnostics.push(
        ...zodErrorToIssues(validation.error, filePath).map((issue) => ({ ...issue, file: filePath }))
      );
      return result;
    }

    for (const [name, config] of Object.entries(validation.data.mcp_servers)) {
      const serverValidation = McpServerConfigSchema.safeParse(config);
      if (!serverValidation.success) {
        result.diagnostics.push(
          ...zodErrorToIssues(serverValidation.error, `${filePath}.mcp_servers.${name}`).map((issue) => ({
            ...issue,
            file: filePath
          }))
        );
        continue;
      }

      result.mcpServers.push({
        name,
        config: serverValidation.data,
        sourcePath: filePath,
        line: findTomlMcpServerLine(content, name),
        fieldLines: findTomlMcpServerFieldLines(content, name)
      });
    }
  } catch (error) {
    result.diagnostics.push({
      severity: "error",
      path: filePath,
      file: filePath,
      message: error instanceof Error ? error.message : String(error)
    });
  }

  return result;
}

/**
 * Reads Codex skills.config entries from config.toml files and returns skills
 * explicitly disabled with enabled = false.
 *
 * @param filePaths - Candidate Codex config files.
 * @returns Disabled skill names.
 */
export async function discoverDisabledSkillNames(filePaths: string[]): Promise<Set<string>> {
  const disabled = new Set<string>();

  for (const filePath of filePaths) {
    if (!(await pathExists(filePath))) {
      continue;
    }

    try {
      const parsed = parseToml(await readFile(filePath, "utf8")) as unknown;
      const entries = extractSkillConfigEntries(parsed);

      for (const entry of entries) {
        if (entry.enabled === false && typeof entry.name === "string") {
          disabled.add(entry.name);
        }
      }
    } catch {
      // Syntax errors are reported by discoverMcpServersFromConfig; avoid
      // duplicating diagnostics in the disabled-skill pre-pass.
    }
  }

  return disabled;
}

/**
 * Discovers plugin manifests from a root directory. Each child can either
 * contain plugin.json directly or a .codex-plugin/plugin.json manifest.
 *
 * @param root - Directory containing plugin folders.
 * @returns Plugin manifests and diagnostics.
 */
export async function discoverPluginsFromRoot(root: string): Promise<DiscoveryResult> {
  const result = cloneEmptyResult();

  if (!(await pathExists(root))) {
    return result;
  }

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const pluginDir = path.join(root, entry.name);
    if (!(entry.isDirectory() || entry.isSymbolicLink()) || !(await isDirectory(pluginDir))) {
      continue;
    }

    const candidates = [
      path.join(pluginDir, ".codex-plugin", "plugin.json"),
      path.join(pluginDir, "plugin.json")
    ];
    const manifestPath = await firstExistingPath(candidates);
    if (!manifestPath) {
      continue;
    }

    try {
      const manifestContent = await readFile(manifestPath, "utf8");
      const parsed = JSON.parse(manifestContent) as unknown;
      const validation = PluginManifestSchema.safeParse(parsed);
      if (!validation.success) {
        result.diagnostics.push(
          ...zodErrorToIssues(validation.error, manifestPath).map((issue) => ({ ...issue, file: manifestPath }))
        );
        continue;
      }

      result.plugins.push({ manifest: validation.data, sourcePath: manifestPath, rootDir: pluginDir });
      mergeResult(
        result,
        await discoverPluginMcpServers(pluginDir, validation.data, manifestPath, manifestContent)
      );
    } catch (error) {
      result.diagnostics.push({
        severity: "error",
        path: manifestPath,
        file: manifestPath,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return result;
}

/**
 * Discovers bundled MCP server definitions referenced by a plugin manifest.
 *
 * @param pluginDir - Plugin root directory.
 * @param manifest - Validated plugin manifest.
 * @param manifestPath - Manifest file path for diagnostics.
 * @returns Discovered MCP servers and diagnostics.
 */
export async function discoverPluginMcpServers(
  pluginDir: string,
  manifest: PluginManifest,
  manifestPath: string,
  manifestContent?: string
): Promise<DiscoveryResult> {
  const result = cloneEmptyResult();
  const directServers =
    typeof manifest.mcpServers === "object" && !Array.isArray(manifest.mcpServers)
      ? manifest.mcpServers
      : manifest.mcp_servers;

  for (const [name, config] of Object.entries(directServers ?? {})) {
    const validation = McpServerConfigSchema.safeParse(config);
    if (!validation.success) {
      result.diagnostics.push(
        ...zodErrorToIssues(validation.error, `${manifestPath}.mcpServers.${name}`).map((issue) => ({
          ...issue,
          file: manifestPath
        }))
      );
      continue;
    }

    result.mcpServers.push({
      name,
      config: validation.data,
      sourcePath: manifestPath,
      line: manifestContent ? findJsonPropertyLine(manifestContent, name) : undefined,
      fieldLines: manifestContent ? findJsonNestedFieldLines(manifestContent, name) : undefined
    });
  }

  if (typeof manifest.mcpServers !== "string") {
    return result;
  }

  const mcpPath = path.resolve(pluginDir, manifest.mcpServers);
  if (!isSubpath(pluginDir, mcpPath)) {
    result.diagnostics.push({
      severity: "error",
      path: `${manifestPath}.mcpServers`,
      file: manifestPath,
      message: "Plugin mcpServers path must stay inside the plugin root."
    });
    return result;
  }

  if (!(await pathExists(mcpPath))) {
    result.diagnostics.push({
      severity: "error",
      path: `${manifestPath}.mcpServers`,
      file: manifestPath,
      message: `Plugin mcpServers file '${manifest.mcpServers}' does not exist.`
    });
    return result;
  }

  try {
    const mcpContent = await readFile(mcpPath, "utf8");
    const parsed = JSON.parse(mcpContent) as unknown;
    const parsedRecord =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    const wrapped = "mcp_servers" in parsedRecord ? McpConfigFileSchema.safeParse(parsed) : undefined;
    const serverMap = wrapped?.success ? wrapped.data.mcp_servers : parsedRecord;

    for (const [name, config] of Object.entries(serverMap as Record<string, unknown>)) {
      const validation = McpServerConfigSchema.safeParse(config);
      if (!validation.success) {
        result.diagnostics.push(
          ...zodErrorToIssues(validation.error, `${mcpPath}.${name}`).map((issue) => ({
            ...issue,
            file: mcpPath
          }))
        );
        continue;
      }

      result.mcpServers.push({
        name,
        config: validation.data,
        sourcePath: mcpPath,
        line: findJsonPropertyLine(mcpContent, name),
        fieldLines: findJsonNestedFieldLines(mcpContent, name)
      });
    }
  } catch (error) {
    result.diagnostics.push({
      severity: "error",
      path: mcpPath,
      file: mcpPath,
      message: error instanceof Error ? error.message : String(error)
    });
  }

  return result;
}

/**
 * Parses YAML frontmatter from SKILL.md.
 *
 * @param markdown - Complete SKILL.md content.
 * @returns Frontmatter object and markdown body.
 */
export function parseSkillMarkdown(markdown: string): ParsedSkillMarkdown {
  const normalizedMarkdown = markdown.replace(/^\uFEFF/, "");
  const match = normalizedMarkdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    throw new Error("SKILL.md must start with YAML frontmatter delimited by ---.");
  }

  const frontmatter = parseYaml(match[1] ?? "") as unknown;
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error("SKILL.md frontmatter must be a YAML object.");
  }

  return {
    frontmatter: frontmatter as Record<string, unknown>,
    body: match[2] ?? ""
  };
}

function cloneEmptyResult(): DiscoveryResult {
  return {
    skills: [...EMPTY_RESULT.skills],
    mcpServers: [...EMPTY_RESULT.mcpServers],
    plugins: [...EMPTY_RESULT.plugins],
    diagnostics: [...EMPTY_RESULT.diagnostics]
  };
}

function mergeResult(target: DiscoveryResult, source: DiscoveryResult): void {
  target.skills.push(...source.skills);
  target.mcpServers.push(...source.mcpServers);
  target.plugins.push(...source.plugins);
  target.diagnostics.push(...source.diagnostics);
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isDirectory();
  } catch {
    return false;
  }
}

async function firstExistingPath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => path.normalize(value)))];
}

function isSubpath(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function loadAgentMetadata(skillDir: string): Promise<unknown> {
  const agentFile = path.join(skillDir, "agents", "openai.yaml");
  if (!(await pathExists(agentFile))) {
    return undefined;
  }

  return parseYaml(await readFile(agentFile, "utf8"));
}

async function detectEntryPoint(
  skillDir: string,
  frontmatter: Record<string, unknown>
): Promise<string | undefined> {
  if (typeof frontmatter.entryPoint === "string") {
    return frontmatter.entryPoint;
  }

  const candidates = [
    "scripts/run.ts",
    "scripts/run.js",
    "scripts/main.ts",
    "scripts/main.js",
    "scripts/index.ts",
    "scripts/index.js"
  ];

  for (const candidate of candidates) {
    if (await pathExists(path.join(skillDir, candidate))) {
      return candidate;
    }
  }

  return undefined;
}

function inferTriggers(text: string): TriggerType[] {
  const value = text.toLowerCase();
  const triggers = new Set<TriggerType>();

  if (/\b(issue|triage|bug report)\b/.test(value)) {
    triggers.add("issue");
  }
  if (/\b(pr|pull request|review)\b/.test(value)) {
    triggers.add("pr");
  }
  if (/\b(release|changelog|notes)\b/.test(value)) {
    triggers.add("release");
  }
  if (/\b(security|vulnerability|audit)\b/.test(value)) {
    triggers.add("security");
  }
  if (/\b(dependency|dependencies|deps)\b/.test(value)) {
    triggers.add("dependency");
  }

  return triggers.size > 0 ? [...triggers] : ["manual"];
}

function extractSkillConfigEntries(input: unknown): Array<{ name?: unknown; enabled?: unknown }> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return [];
  }

  const record = input as Record<string, unknown>;
  const skills = record.skills;
  if (!skills || typeof skills !== "object" || Array.isArray(skills)) {
    return [];
  }

  const config = (skills as Record<string, unknown>).config;
  if (Array.isArray(config)) {
    return config.filter((entry): entry is { name?: unknown; enabled?: unknown } =>
      Boolean(entry && typeof entry === "object" && !Array.isArray(entry))
    );
  }

  if (config && typeof config === "object") {
    return Object.entries(config as Record<string, unknown>)
      .filter(([, value]) => value && typeof value === "object" && !Array.isArray(value))
      .map(([name, value]) => ({
        name,
        ...(value as Record<string, unknown>)
      }));
  }

  return [];
}

function collectYamlFrontmatterLines(markdown: string): Record<string, number> {
  const lines = markdown.replace(/^\uFEFF/, "").split(/\r?\n/);
  const sourceLines: Record<string, number> = {};

  if (lines[0]?.trim() !== "---") {
    return sourceLines;
  }

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line?.trim() === "---") {
      break;
    }

    const match = line?.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*:/);
    if (match?.[1]) {
      sourceLines[match[1]] = index + 1;
    }
  }

  return sourceLines;
}

function lineForIssuePath(pathValue: string, sourceLines: Record<string, number>): number | undefined {
  const field = Object.keys(sourceLines).find((key) => pathValue.endsWith(`.${key}`));
  return field ? sourceLines[field] : undefined;
}

function findTomlMcpServerLine(content: string, name: string): number | undefined {
  return findTomlMcpServerHeader(content, name)?.line;
}

function findTomlMcpServerFieldLines(content: string, name: string): Record<string, number> {
  const header = findTomlMcpServerHeader(content, name);
  if (!header) {
    return {};
  }

  const lines = content.split(/\r?\n/);
  const fieldLines: Record<string, number> = {};

  for (let index = header.index + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^\s*\[/.test(line)) {
      break;
    }

    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_-]*)\s*=/);
    if (match?.[1]) {
      fieldLines[match[1]] = index + 1;
    }
  }

  return fieldLines;
}

function findTomlMcpServerHeader(
  content: string,
  name: string
): { index: number; line: number } | undefined {
  const escapedName = escapeRegExp(name);
  const headerPattern = new RegExp(
    `^\\s*\\[\\s*mcp_servers\\.(?:"${escapedName}"|'${escapedName}'|${escapedName})\\s*\\]\\s*$`
  );

  const lines = content.split(/\r?\n/);
  const index = lines.findIndex((line) => headerPattern.test(line));
  return index >= 0 ? { index, line: index + 1 } : undefined;
}

function findJsonPropertyLine(content: string, key: string): number | undefined {
  const propertyPattern = new RegExp(`"${escapeRegExp(key)}"\\s*:`);
  const index = content.split(/\r?\n/).findIndex((line) => propertyPattern.test(line));
  return index >= 0 ? index + 1 : undefined;
}

function findJsonNestedFieldLines(content: string, objectKey: string): Record<string, number> {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex((line) =>
    new RegExp(`"${escapeRegExp(objectKey)}"\\s*:`).test(line)
  );
  const fieldLines: Record<string, number> = {};

  if (startIndex < 0) {
    return fieldLines;
  }

  let depth = 0;
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (depth > 0) {
      const match = line.match(/^\s*"([^"]+)"\s*:/);
      if (match?.[1] && match[1] !== objectKey) {
        fieldLines[match[1]] = index + 1;
      }
    }

    depth += countChar(line, "{") - countChar(line, "}");
    if (index > startIndex && depth <= 0) {
      break;
    }
  }

  return fieldLines;
}

function countChar(value: string, target: string): number {
  return [...value].filter((char) => char === target).length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
