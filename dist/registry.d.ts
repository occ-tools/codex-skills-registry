import { type AuditOptions } from "./audit.js";
import { type DiscoverOptions, type DiscoveredMcpServer, type DiscoveredPlugin, type DiscoveryDiagnostic } from "./discovery.js";
import { type RegistryPolicy } from "./policy.js";
import { type CodexSkill, type ValidationIssue, type ValidationResult } from "./schema.js";
import { type DiscoveredWorkflow } from "./workflows.js";
export interface RegistryLoadOptions extends DiscoverOptions {
    configFile?: string;
    policyFile?: string;
}
export interface RegistryIndex {
    generatedAt: string;
    skills: CodexSkill[];
    mcpServers: DiscoveredMcpServer[];
    plugins: DiscoveredPlugin[];
    workflows: DiscoveredWorkflow[];
    diagnostics: DiscoveryDiagnostic[];
    policy: RegistryPolicy;
}
export interface RegistryIndexOptions {
    relativePaths?: boolean;
}
export interface RegisterOptions {
    overwrite?: boolean;
}
/**
 * In-memory index for Codex maintainer automation assets. The registry is
 * deliberately small and side-effect free: it validates, lists, and prepares
 * mock runs, but never executes arbitrary skill scripts.
 */
export declare class SkillsRegistry {
    private cwd;
    private readonly skills;
    private readonly mcpServers;
    private readonly plugins;
    private readonly workflows;
    private readonly diagnostics;
    private policy;
    private policyPath?;
    /**
     * Builds a registry from project directories and optional JSON/YAML config.
     *
     * @param options - Discovery roots and optional config file.
     * @returns Loaded registry instance.
     */
    static load(options?: RegistryLoadOptions): Promise<SkillsRegistry>;
    /**
     * Registers a normalized Codex Skill.
     *
     * @param skill - Skill entry to add.
     * @param options - Duplicate handling behavior.
     * @returns Validation result for this registration attempt.
     */
    registerSkill(skill: CodexSkill, options?: RegisterOptions): ValidationResult;
    /**
     * Loads skill declarations from a JSON or YAML file. The file can be either
     * an array of skill entries or an object with a skills array.
     *
     * @param filePath - JSON, YAML, or YML file path.
     */
    loadFromConfigFile(filePath: string): Promise<void>;
    /**
     * Lists registered skills in stable alphabetical order.
     *
     * @returns Registered skills.
     */
    listSkills(): CodexSkill[];
    /**
     * Retrieves a skill by exact registry name.
     *
     * @param name - Skill name.
     * @returns Matching skill when present.
     */
    getSkill(name: string): CodexSkill | undefined;
    /**
     * Validates an already-normalized skill object.
     *
     * @param skill - Candidate skill entry.
     * @returns Validation result.
     */
    validateSkill(skill: unknown): ValidationResult;
    /**
     * Validates a named registered skill, including local entry point existence
     * when the skill was discovered from disk.
     *
     * @param name - Registered skill name.
     * @returns Validation result.
     */
    validateSkillByName(name: string): Promise<ValidationResult>;
    /**
     * Validates every registered skill.
     *
     * @returns Map keyed by skill name.
     */
    validateAllSkills(): Promise<Map<string, ValidationResult>>;
    /**
     * Lists discovered MCP server configurations.
     *
     * @returns MCP server entries.
     */
    listMcpServers(): DiscoveredMcpServer[];
    /**
     * Lists discovered plugin manifests.
     *
     * @returns Plugin entries.
     */
    listPlugins(): DiscoveredPlugin[];
    /**
     * Lists discovered GitHub Actions workflow files.
     *
     * @returns Workflow entries.
     */
    listWorkflows(): DiscoveredWorkflow[];
    /**
     * Returns discovery and registry diagnostics collected during loading.
     *
     * @returns Diagnostics.
     */
    listDiagnostics(): DiscoveryDiagnostic[];
    /**
     * Returns the project policy currently applied to audits and plugin checks.
     *
     * @returns Registry policy.
     */
    getPolicy(): RegistryPolicy;
    /**
     * Returns the loaded policy file path, if one was discovered.
     *
     * @returns Policy file path.
     */
    getPolicyPath(): string | undefined;
    /**
     * Audits registered skills and MCP server configs for review-worthy safety
     * risks such as shell execution, unpinned npx packages, broad MCP tools, and
     * entry points that escape the skill directory.
     *
     * @param options - Audit strictness options.
     * @returns Audit issues.
     */
    audit(options?: AuditOptions): ValidationIssue[];
    /**
     * Creates a serializable registry index suitable for CI artifacts.
     *
     * @returns Registry snapshot.
     */
    toIndex(options?: RegistryIndexOptions): RegistryIndex;
    /**
     * Formats skills as a compact terminal table.
     *
     * @returns Table string.
     */
    formatSkillsTable(): string;
    private addDiagnostics;
    private validatePlugins;
    private resolvePluginSkillReferences;
}
/**
 * Formats validation issues for terminal output.
 *
 * @param issues - Issues to format.
 * @returns Human-readable lines.
 */
export declare function formatValidationIssues(issues: ValidationIssue[], options?: {
    cwd?: string;
}): string;
