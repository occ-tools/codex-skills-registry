import { z, type ZodError } from "zod";
/**
 * Supported maintainer workflow triggers. The values intentionally map to
 * everyday OSS maintenance events rather than product-specific webhook names.
 */
export declare const TriggerTypeSchema: z.ZodEnum<{
    issue: "issue";
    pr: "pr";
    release: "release";
    manual: "manual";
    security: "security";
    dependency: "dependency";
}>;
export type TriggerType = z.infer<typeof TriggerTypeSchema>;
export declare const SkillNameSchema: z.ZodString;
/**
 * Frontmatter accepted in a Codex Skill SKILL.md file. Codex itself requires
 * name and description; this project accepts extra maintainer metadata for
 * registry, CI, and mock execution workflows. Extra frontmatter fields are
 * preserved here and then normalized into the strict registry shape below.
 */
export declare const SkillFrontmatterSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    triggers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        issue: "issue";
        pr: "pr";
        release: "release";
        manual: "manual";
        security: "security";
        dependency: "dependency";
    }>>>;
    triggerType: z.ZodOptional<z.ZodEnum<{
        issue: "issue";
        pr: "pr";
        release: "release";
        manual: "manual";
        security: "security";
        dependency: "dependency";
    }>>;
    entryPoint: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$loose>;
export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;
/**
 * Normalized registry entry for a Codex Skill. Discovery layers convert
 * official SKILL.md frontmatter, JSON/YAML config entries, and legacy
 * skillName-style records into this single shape.
 */
export declare const CodexSkillSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    triggers: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        issue: "issue";
        pr: "pr";
        release: "release";
        manual: "manual";
        security: "security";
        dependency: "dependency";
    }>>>;
    entryPoint: z.ZodOptional<z.ZodString>;
    rootDir: z.ZodOptional<z.ZodString>;
    skillFile: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodEnum<{
        project: "project";
        example: "example";
        plugin: "plugin";
        config: "config";
        inline: "inline";
    }>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type CodexSkill = z.infer<typeof CodexSkillSchema>;
export declare const StdioMcpServerConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
    tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
    enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
        never: "never";
        prompt: "prompt";
        approve: "approve";
        reject: "reject";
        always: "always";
    }>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
    }, z.core.$loose>>>;
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    env_vars: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        name: z.ZodString;
        source: z.ZodOptional<z.ZodEnum<{
            local: "local";
            remote: "remote";
        }>>;
    }, z.core.$loose>]>>>;
    cwd: z.ZodOptional<z.ZodString>;
    experimental_environment: z.ZodOptional<z.ZodEnum<{
        remote: "remote";
    }>>;
}, z.core.$loose>;
export declare const HttpMcpServerConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
    tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
    enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
        never: "never";
        prompt: "prompt";
        approve: "approve";
        reject: "reject";
        always: "always";
    }>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
    }, z.core.$loose>>>;
    url: z.ZodString;
    bearer_token_env_var: z.ZodOptional<z.ZodString>;
    http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    env_http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$loose>;
/**
 * MCP server configuration accepted by Codex config.toml. This schema covers
 * both local stdio servers and streamable HTTP servers while preserving
 * unknown future fields.
 */
export declare const McpServerConfigSchema: z.ZodUnion<readonly [z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
    tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
    enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
        never: "never";
        prompt: "prompt";
        approve: "approve";
        reject: "reject";
        always: "always";
    }>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
    }, z.core.$loose>>>;
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    env_vars: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        name: z.ZodString;
        source: z.ZodOptional<z.ZodEnum<{
            local: "local";
            remote: "remote";
        }>>;
    }, z.core.$loose>]>>>;
    cwd: z.ZodOptional<z.ZodString>;
    experimental_environment: z.ZodOptional<z.ZodEnum<{
        remote: "remote";
    }>>;
}, z.core.$loose>, z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
    tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
    enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
        never: "never";
        prompt: "prompt";
        approve: "approve";
        reject: "reject";
        always: "always";
    }>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
    }, z.core.$loose>>>;
    url: z.ZodString;
    bearer_token_env_var: z.ZodOptional<z.ZodString>;
    http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    env_http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$loose>]>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export declare const McpConfigFileSchema: z.ZodObject<{
    mcp_servers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
        tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
        enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
        tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            approval_mode: z.ZodOptional<z.ZodEnum<{
                never: "never";
                prompt: "prompt";
                approve: "approve";
                reject: "reject";
                always: "always";
            }>>;
        }, z.core.$loose>>>;
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        env_vars: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            name: z.ZodString;
            source: z.ZodOptional<z.ZodEnum<{
                local: "local";
                remote: "remote";
            }>>;
        }, z.core.$loose>]>>>;
        cwd: z.ZodOptional<z.ZodString>;
        experimental_environment: z.ZodOptional<z.ZodEnum<{
            remote: "remote";
        }>>;
    }, z.core.$loose>, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
        tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
        enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
        tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            approval_mode: z.ZodOptional<z.ZodEnum<{
                never: "never";
                prompt: "prompt";
                approve: "approve";
                reject: "reject";
                always: "always";
            }>>;
        }, z.core.$loose>>>;
        url: z.ZodString;
        bearer_token_env_var: z.ZodOptional<z.ZodString>;
        http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        env_http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$loose>]>>>;
}, z.core.$loose>;
export type McpConfigFile = z.infer<typeof McpConfigFileSchema>;
export declare const PluginSkillReferenceSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
}, z.core.$loose>]>;
export declare const PluginSkillsSchema: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
}, z.core.$loose>]>>]>>;
export declare const PluginMcpServersSchema: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
    tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
    enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
        never: "never";
        prompt: "prompt";
        approve: "approve";
        reject: "reject";
        always: "always";
    }>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
    }, z.core.$loose>>>;
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    env_vars: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        name: z.ZodString;
        source: z.ZodOptional<z.ZodEnum<{
            local: "local";
            remote: "remote";
        }>>;
    }, z.core.$loose>]>>>;
    cwd: z.ZodOptional<z.ZodString>;
    experimental_environment: z.ZodOptional<z.ZodEnum<{
        remote: "remote";
    }>>;
}, z.core.$loose>, z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    required: z.ZodOptional<z.ZodBoolean>;
    startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
    tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
    enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
        never: "never";
        prompt: "prompt";
        approve: "approve";
        reject: "reject";
        always: "always";
    }>>;
    tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
    }, z.core.$loose>>>;
    url: z.ZodString;
    bearer_token_env_var: z.ZodOptional<z.ZodString>;
    http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    env_http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$loose>]>>]>>;
export declare const PluginManifestSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        name: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>]>>;
    homepage: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
    skills: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
    }, z.core.$loose>]>>]>>;
    mcpServers: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
        tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
        enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
        tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            approval_mode: z.ZodOptional<z.ZodEnum<{
                never: "never";
                prompt: "prompt";
                approve: "approve";
                reject: "reject";
                always: "always";
            }>>;
        }, z.core.$loose>>>;
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        env_vars: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            name: z.ZodString;
            source: z.ZodOptional<z.ZodEnum<{
                local: "local";
                remote: "remote";
            }>>;
        }, z.core.$loose>]>>>;
        cwd: z.ZodOptional<z.ZodString>;
        experimental_environment: z.ZodOptional<z.ZodEnum<{
            remote: "remote";
        }>>;
    }, z.core.$loose>, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
        tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
        enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
        tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            approval_mode: z.ZodOptional<z.ZodEnum<{
                never: "never";
                prompt: "prompt";
                approve: "approve";
                reject: "reject";
                always: "always";
            }>>;
        }, z.core.$loose>>>;
        url: z.ZodString;
        bearer_token_env_var: z.ZodOptional<z.ZodString>;
        http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        env_http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$loose>]>>]>>;
    apps: z.ZodOptional<z.ZodString>;
    hooks: z.ZodOptional<z.ZodUnknown>;
    interface: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    mcp_servers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
        tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
        enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
        tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            approval_mode: z.ZodOptional<z.ZodEnum<{
                never: "never";
                prompt: "prompt";
                approve: "approve";
                reject: "reject";
                always: "always";
            }>>;
        }, z.core.$loose>>>;
        command: z.ZodString;
        args: z.ZodOptional<z.ZodArray<z.ZodString>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        env_vars: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            name: z.ZodString;
            source: z.ZodOptional<z.ZodEnum<{
                local: "local";
                remote: "remote";
            }>>;
        }, z.core.$loose>]>>>;
        cwd: z.ZodOptional<z.ZodString>;
        experimental_environment: z.ZodOptional<z.ZodEnum<{
            remote: "remote";
        }>>;
    }, z.core.$loose>, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        required: z.ZodOptional<z.ZodBoolean>;
        startup_timeout_sec: z.ZodOptional<z.ZodNumber>;
        tool_timeout_sec: z.ZodOptional<z.ZodNumber>;
        enabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        disabled_tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default_tools_approval_mode: z.ZodOptional<z.ZodEnum<{
            never: "never";
            prompt: "prompt";
            approve: "approve";
            reject: "reject";
            always: "always";
        }>>;
        tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            approval_mode: z.ZodOptional<z.ZodEnum<{
                never: "never";
                prompt: "prompt";
                approve: "approve";
                reject: "reject";
                always: "always";
            }>>;
        }, z.core.$loose>>>;
        url: z.ZodString;
        bearer_token_env_var: z.ZodOptional<z.ZodString>;
        http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        env_http_headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$loose>]>>>;
}, z.core.$loose>;
export type PluginManifest = z.infer<typeof PluginManifestSchema>;
export type ValidationSeverity = "error" | "warning";
export interface ValidationIssue {
    severity: ValidationSeverity;
    code?: string;
    path: string;
    message: string;
    help?: string;
    file?: string;
    line?: number;
}
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}
/**
 * Converts Zod issues into stable, CLI-friendly validation messages.
 *
 * @param error - Zod validation error to convert.
 * @param basePath - Optional prefix such as a filename or registry path.
 * @returns Normalized validation issues.
 */
export declare function zodErrorToIssues(error: ZodError, basePath?: string): ValidationIssue[];
/**
 * Normalizes user-facing skill declarations into the canonical registry
 * schema. This accepts both official SKILL.md field names and the older
 * skillName/triggerType shape that appears in older registry records.
 *
 * @param input - Unknown skill-like record.
 * @param defaults - Registry-controlled fields such as source and filesystem paths.
 * @returns A validated CodexSkill registry entry.
 */
export declare function normalizeSkillInput(input: unknown, defaults?: Partial<CodexSkill>): CodexSkill;
