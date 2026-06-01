import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { auditRegistry, type AuditOptions } from "./audit.js";
import {
  discoverProject,
  parseSkillMarkdown,
  type DiscoverOptions,
  type DiscoveredMcpServer,
  type DiscoveredPlugin,
  type DiscoveryDiagnostic
} from "./discovery.js";
import {
  DEFAULT_POLICY,
  loadRegistryPolicy,
  type RegistryPolicy
} from "./policy.js";
import {
  CodexSkillSchema,
  normalizeSkillInput,
  zodErrorToIssues,
  type CodexSkill,
  type ValidationIssue,
  type ValidationResult
} from "./schema.js";

export interface RegistryLoadOptions extends DiscoverOptions {
  configFile?: string;
  policyFile?: string;
}

export interface RegistryIndex {
  generatedAt: string;
  skills: CodexSkill[];
  mcpServers: DiscoveredMcpServer[];
  plugins: DiscoveredPlugin[];
  diagnostics: DiscoveryDiagnostic[];
  policy: RegistryPolicy;
}

export interface RegisterOptions {
  overwrite?: boolean;
}

/**
 * In-memory index for Codex maintainer automation assets. The registry is
 * deliberately small and side-effect free: it validates, lists, and prepares
 * mock runs, but never executes arbitrary skill scripts.
 */
export class SkillsRegistry {
  private readonly skills = new Map<string, CodexSkill>();
  private readonly mcpServers: DiscoveredMcpServer[] = [];
  private readonly plugins: DiscoveredPlugin[] = [];
  private readonly diagnostics: DiscoveryDiagnostic[] = [];
  private policy: RegistryPolicy = DEFAULT_POLICY;
  private policyPath?: string;

  /**
   * Builds a registry from project directories and optional JSON/YAML config.
   *
   * @param options - Discovery roots and optional config file.
   * @returns Loaded registry instance.
   */
  static async load(options: RegistryLoadOptions = {}): Promise<SkillsRegistry> {
    const registry = new SkillsRegistry();
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const policy = await loadRegistryPolicy(cwd, options.policyFile);
    const discovered = await discoverProject(options);

    registry.policy = policy.policy;
    registry.policyPath = policy.sourcePath;
    registry.addDiagnostics(policy.diagnostics);
    registry.addDiagnostics(discovered.diagnostics);
    registry.mcpServers.push(...dedupeMcpServers(discovered.mcpServers));
    registry.plugins.push(...discovered.plugins);

    for (const skill of discovered.skills) {
      registry.registerSkill(skill);
    }

    if (options.configFile) {
      await registry.loadFromConfigFile(path.resolve(options.cwd ?? process.cwd(), options.configFile));
    }

    await registry.validatePlugins();

    return registry;
  }

  /**
   * Registers a normalized Codex Skill.
   *
   * @param skill - Skill entry to add.
   * @param options - Duplicate handling behavior.
   * @returns Validation result for this registration attempt.
   */
  registerSkill(skill: CodexSkill, options: RegisterOptions = {}): ValidationResult {
    const validation = this.validateSkill(skill);
    if (!validation.valid) {
      return validation;
    }

    if (this.skills.has(skill.name) && !options.overwrite) {
      const issue: ValidationIssue = {
        severity: "warning",
        path: skill.name,
        message: `Duplicate skill '${skill.name}' ignored. Use overwrite to replace it.`
      };
      this.diagnostics.push(issue);
      return { valid: true, issues: [issue] };
    }

    this.skills.set(skill.name, skill);
    return { valid: true, issues: [] };
  }

  /**
   * Loads skill declarations from a JSON or YAML file. The file can be either
   * an array of skill entries or an object with a skills array.
   *
   * @param filePath - JSON, YAML, or YML file path.
   */
  async loadFromConfigFile(filePath: string): Promise<void> {
    const content = await readFile(filePath, "utf8");
    const parsed = parseStructuredConfig(content, filePath);
    const skillsInput = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { skills?: unknown }).skills)
        ? (parsed as { skills: unknown[] }).skills
        : undefined;

    if (!skillsInput) {
      this.diagnostics.push({
        severity: "error",
        path: filePath,
        file: filePath,
        message: "Config file must be an array of skills or an object with a skills array."
      });
      return;
    }

    for (const [index, input] of skillsInput.entries()) {
      try {
        const skill = normalizeSkillInput(input, {
          source: "config",
          skillFile: filePath
        });
        this.registerSkill(skill, { overwrite: true });
      } catch (error) {
        this.diagnostics.push({
          severity: "error",
          path: `${filePath}.skills.${index}`,
          file: filePath,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Lists registered skills in stable alphabetical order.
   *
   * @returns Registered skills.
   */
  listSkills(): CodexSkill[] {
    return [...this.skills.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Retrieves a skill by exact registry name.
   *
   * @param name - Skill name.
   * @returns Matching skill when present.
   */
  getSkill(name: string): CodexSkill | undefined {
    return this.skills.get(name);
  }

  /**
   * Validates an already-normalized skill object.
   *
   * @param skill - Candidate skill entry.
   * @returns Validation result.
   */
  validateSkill(skill: unknown): ValidationResult {
    const validation = CodexSkillSchema.safeParse(skill);
    if (validation.success) {
      return { valid: true, issues: [] };
    }

    return { valid: false, issues: zodErrorToIssues(validation.error) };
  }

  /**
   * Validates a named registered skill, including local entry point existence
   * when the skill was discovered from disk.
   *
   * @param name - Registered skill name.
   * @returns Validation result.
   */
  async validateSkillByName(name: string): Promise<ValidationResult> {
    const skill = this.getSkill(name);
    if (!skill) {
      return {
        valid: false,
        issues: [
          {
            severity: "error",
            path: name,
            message: `Skill '${name}' is not registered.`
          }
        ]
      };
    }

    const result = this.validateSkill(skill);
    const issues = [...result.issues];

    if (skill.entryPoint && skill.rootDir) {
      const entryPath = path.resolve(skill.rootDir, skill.entryPoint);
      if (path.isAbsolute(skill.entryPoint) || !isSubpath(skill.rootDir, entryPath)) {
        issues.push({
          severity: "error",
          path: `${skill.name}.entryPoint`,
          message: "Configured entryPoint must be relative and stay inside the skill directory."
        });
      } else {
        try {
          await access(entryPath);
        } catch {
          issues.push({
            severity: "error",
            path: entryPath,
            message: "Configured entryPoint does not exist."
          });
        }
      }
    }

    return {
      valid: issues.every((issue) => issue.severity !== "error"),
      issues
    };
  }

  /**
   * Validates every registered skill.
   *
   * @returns Map keyed by skill name.
   */
  async validateAllSkills(): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    for (const skill of this.listSkills()) {
      results.set(skill.name, await this.validateSkillByName(skill.name));
    }

    return results;
  }

  /**
   * Lists discovered MCP server configurations.
   *
   * @returns MCP server entries.
   */
  listMcpServers(): DiscoveredMcpServer[] {
    return [...this.mcpServers].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Lists discovered plugin manifests.
   *
   * @returns Plugin entries.
   */
  listPlugins(): DiscoveredPlugin[] {
    return [...this.plugins].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  }

  /**
   * Returns discovery and registry diagnostics collected during loading.
   *
   * @returns Diagnostics.
   */
  listDiagnostics(): DiscoveryDiagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Returns the project policy currently applied to audits and plugin checks.
   *
   * @returns Registry policy.
   */
  getPolicy(): RegistryPolicy {
    return this.policy;
  }

  /**
   * Returns the loaded policy file path, if one was discovered.
   *
   * @returns Policy file path.
   */
  getPolicyPath(): string | undefined {
    return this.policyPath;
  }

  /**
   * Audits registered skills and MCP server configs for review-worthy safety
   * risks such as shell execution, unpinned npx packages, broad MCP tools, and
   * entry points that escape the skill directory.
   *
   * @param options - Audit strictness options.
   * @returns Audit issues.
   */
  audit(options: AuditOptions = {}): ValidationIssue[] {
    return auditRegistry(
      {
        skills: this.listSkills(),
        mcpServers: this.listMcpServers()
      },
      {
        ...options,
        policy: options.policy ?? this.policy
      }
    );
  }

  /**
   * Creates a serializable registry index suitable for CI artifacts.
   *
   * @returns Registry snapshot.
   */
  toIndex(): RegistryIndex {
    return {
      generatedAt: new Date().toISOString(),
      skills: this.listSkills(),
      mcpServers: this.listMcpServers(),
      plugins: this.listPlugins(),
      diagnostics: [...this.listDiagnostics(), ...this.audit()],
      policy: this.policy
    };
  }

  /**
   * Formats skills as a compact terminal table.
   *
   * @returns Table string.
   */
  formatSkillsTable(): string {
    const rows = this.listSkills().map((skill) => ({
      name: skill.name,
      triggers: skill.triggers.join(","),
      version: skill.version,
      source: skill.source,
      description: skill.description
    }));

    return formatTable(rows, ["name", "triggers", "version", "source", "description"]);
  }

  private addDiagnostics(diagnostics: DiscoveryDiagnostic[]): void {
    this.diagnostics.push(...diagnostics);
  }

  private async validatePlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      const declaredMcpServers = new Set([
        ...Object.keys(plugin.manifest.mcp_servers),
        ...(plugin.manifest.mcpServers &&
        typeof plugin.manifest.mcpServers === "object" &&
        !Array.isArray(plugin.manifest.mcpServers)
          ? Object.keys(plugin.manifest.mcpServers)
          : [])
      ]);

      const skillReferences = await this.resolvePluginSkillReferences(plugin);
      for (const [index, reference] of skillReferences.entries()) {
        if (typeof reference === "string") {
          if (this.policy.requirePluginSkillPaths) {
            this.diagnostics.push({
              severity: "error",
              path: `${plugin.sourcePath}.skills.${index}`,
              file: plugin.sourcePath,
              message: "Project policy requires plugin skill references to include a path."
            });
          }
          continue;
        }

        const skillPath = path.resolve(plugin.rootDir, reference.path);
        if (!isSubpath(plugin.rootDir, skillPath)) {
          this.diagnostics.push({
            severity: "error",
            path: `${plugin.sourcePath}.skills.${index}.path`,
            file: plugin.sourcePath,
            message: "Plugin skill path must stay inside the plugin root."
          });
          continue;
        }

        const skillFile = path.join(skillPath, "SKILL.md");

        try {
          await access(skillFile);
          const parsed = parseSkillMarkdown(await readFile(skillFile, "utf8"));
          const discoveredName = String(parsed.frontmatter.name ?? "");

          if (reference.name && reference.name !== discoveredName) {
            this.diagnostics.push({
              severity: "error",
              path: `${plugin.sourcePath}.skills.${index}.name`,
              file: plugin.sourcePath,
              message: `Plugin declares skill '${reference.name}' but SKILL.md declares '${discoveredName}'.`
            });
          }
        } catch (error) {
          this.diagnostics.push({
            severity: "error",
            path: `${plugin.sourcePath}.skills.${index}.path`,
            file: plugin.sourcePath,
            message:
              error instanceof Error
                ? `Plugin skill path '${reference.path}' is invalid: ${error.message}`
                : `Plugin skill path '${reference.path}' is invalid.`
          });
        }
      }

      for (const serverName of declaredMcpServers) {
        if (!this.mcpServers.some((server) => server.name === serverName)) {
          this.diagnostics.push({
            severity: "warning",
            path: `${plugin.sourcePath}.mcp_servers.${serverName}`,
            file: plugin.sourcePath,
            message:
              "Plugin bundles an MCP server that is not present in the discovered project config; this is allowed but should be reviewed."
          });
        }
      }
    }
  }

  private async resolvePluginSkillReferences(
    plugin: DiscoveredPlugin
  ): Promise<Array<string | { name?: string; path: string }>> {
    if (!plugin.manifest.skills) {
      return [];
    }

    if (Array.isArray(plugin.manifest.skills)) {
      return plugin.manifest.skills;
    }

    const skillsRoot = path.resolve(plugin.rootDir, plugin.manifest.skills);
    if (!isSubpath(plugin.rootDir, skillsRoot)) {
      this.diagnostics.push({
        severity: "error",
        path: `${plugin.sourcePath}.skills`,
        file: plugin.sourcePath,
        message: "Plugin skills path must stay inside the plugin root."
      });
      return [];
    }

    try {
      const entries = await import("node:fs/promises").then((fs) =>
        fs.readdir(skillsRoot, { withFileTypes: true })
      );
      return entries
        .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
        .map((entry) => ({
          path: path.relative(plugin.rootDir, path.join(skillsRoot, entry.name))
        }));
    } catch (error) {
      this.diagnostics.push({
        severity: "error",
        path: `${plugin.sourcePath}.skills`,
        file: plugin.sourcePath,
        message:
          error instanceof Error
            ? `Plugin skills path '${plugin.manifest.skills}' is invalid: ${error.message}`
            : `Plugin skills path '${plugin.manifest.skills}' is invalid.`
      });
      return [];
    }
  }
}

/**
 * Formats validation issues for terminal output.
 *
 * @param issues - Issues to format.
 * @returns Human-readable lines.
 */
export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "No validation issues found.";
  }

  return issues
    .map((issue) => `[${issue.severity.toUpperCase()}] ${issue.path}: ${issue.message}`)
    .join("\n");
}

function parseStructuredConfig(content: string, filePath: string): unknown {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".json") {
    return JSON.parse(content) as unknown;
  }

  if (extension === ".yaml" || extension === ".yml") {
    return parseYaml(content) as unknown;
  }

  throw new Error("Supported config extensions are .json, .yaml, and .yml.");
}

function formatTable<T extends Record<string, string>>(rows: T[], columns: (keyof T)[]): string {
  if (rows.length === 0) {
    return "No skills registered.";
  }

  const widths = Object.fromEntries(
    columns.map((column) => [
      column,
      Math.max(String(column).length, ...rows.map((row) => String(row[column]).length))
    ])
  ) as Record<keyof T, number>;

  const header = columns.map((column) => String(column).padEnd(widths[column])).join("  ");
  const divider = columns.map((column) => "-".repeat(widths[column])).join("  ");
  const body = rows
    .map((row) => columns.map((column) => String(row[column]).padEnd(widths[column])).join("  "))
    .join("\n");

  return `${header}\n${divider}\n${body}`;
}

function dedupeMcpServers(servers: DiscoveredMcpServer[]): DiscoveredMcpServer[] {
  const seen = new Set<string>();
  const deduped: DiscoveredMcpServer[] = [];

  for (const server of servers) {
    const key = `${server.sourcePath}:${server.name}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(server);
  }

  return deduped;
}

function isSubpath(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
