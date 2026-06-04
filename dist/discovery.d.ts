import { type CodexSkill, type McpServerConfig, type PluginManifest, type ValidationIssue } from "./schema.js";
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
/**
 * Discovers Codex Skills, MCP server definitions, and plugin manifests from a
 * project tree. By default it also includes the bundled examples so a fresh
 * clone can demonstrate useful output immediately.
 *
 * @param options - Discovery roots and behavior switches.
 * @returns Normalized registry inputs plus validation diagnostics.
 */
export declare function discoverProject(options?: DiscoverOptions): Promise<DiscoveryResult>;
/**
 * Finds .agents/skills directories from the current working directory up to the
 * repository root or filesystem root.
 *
 * @param startDir - Directory where Codex was launched.
 * @returns Existing skill root directories.
 */
export declare function findSkillRoots(startDir: string): Promise<string[]>;
/**
 * Loads all direct child skill directories under a Codex skill root.
 *
 * @param root - Directory containing one child folder per skill.
 * @param source - Registry source label used in normalized entries.
 * @returns Discovered skills and diagnostics.
 */
export declare function discoverSkillsFromRoot(root: string, source?: CodexSkill["source"], disabledSkills?: Set<string>): Promise<DiscoveryResult>;
/**
 * Loads and normalizes a single Codex Skill directory.
 *
 * @param skillDir - Directory containing SKILL.md.
 * @param source - Registry source label.
 * @returns One skill entry or diagnostics when invalid.
 */
export declare function loadSkillFromDirectory(skillDir: string, source?: CodexSkill["source"]): Promise<DiscoveryResult>;
/**
 * Parses Codex MCP server configuration from a config.toml file.
 *
 * @param filePath - TOML file path.
 * @returns MCP server entries and diagnostics.
 */
export declare function discoverMcpServersFromConfig(filePath: string): Promise<DiscoveryResult>;
/**
 * Reads Codex skills.config entries from config.toml files and returns skills
 * explicitly disabled with enabled = false.
 *
 * @param filePaths - Candidate Codex config files.
 * @returns Disabled skill names.
 */
export declare function discoverDisabledSkillNames(filePaths: string[]): Promise<Set<string>>;
/**
 * Discovers plugin manifests from a root directory. Each child can either
 * contain plugin.json directly or a .codex-plugin/plugin.json manifest.
 *
 * @param root - Directory containing plugin folders.
 * @returns Plugin manifests and diagnostics.
 */
export declare function discoverPluginsFromRoot(root: string): Promise<DiscoveryResult>;
/**
 * Discovers bundled MCP server definitions referenced by a plugin manifest.
 *
 * @param pluginDir - Plugin root directory.
 * @param manifest - Validated plugin manifest.
 * @param manifestPath - Manifest file path for diagnostics.
 * @returns Discovered MCP servers and diagnostics.
 */
export declare function discoverPluginMcpServers(pluginDir: string, manifest: PluginManifest, manifestPath: string, manifestContent?: string): Promise<DiscoveryResult>;
/**
 * Parses YAML frontmatter from SKILL.md.
 *
 * @param markdown - Complete SKILL.md content.
 * @returns Frontmatter object and markdown body.
 */
export declare function parseSkillMarkdown(markdown: string): ParsedSkillMarkdown;
export {};
