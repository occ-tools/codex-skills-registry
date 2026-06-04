import { z } from "zod";
export declare const JSON_SCHEMA_BASE_ID = "https://wangjiehu.github.io/codex-skills-registry/schemas";
declare const JSON_SCHEMA_DEFINITIONS: readonly [{
    readonly name: "skill-frontmatter";
    readonly definitionName: "SkillFrontmatter";
    readonly title: "Codex Skill Frontmatter";
    readonly description: "YAML frontmatter accepted in a Codex Skill SKILL.md file by codex-skills-registry.";
    readonly schema: z.ZodObject<{
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
    readonly examples: [{
        readonly name: "issue-triage";
        readonly description: "Triage GitHub issues and prepare maintainer next actions.";
        readonly version: "0.1.0";
        readonly triggers: readonly ["issue"];
        readonly entryPoint: "scripts/run.ts";
        readonly tags: readonly ["maintainer", "triage"];
    }];
}, {
    readonly name: "skill";
    readonly definitionName: "CodexSkill";
    readonly title: "Normalized Codex Skill";
    readonly description: "Normalized registry entry produced from SKILL.md, config files, plugin bundles, or inline SDK records.";
    readonly schema: z.ZodObject<{
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
    readonly examples: [{
        readonly name: "issue-triage";
        readonly description: "Triage GitHub issues and prepare maintainer next actions.";
        readonly version: "0.1.0";
        readonly triggers: readonly ["issue"];
        readonly source: "project";
        readonly tags: readonly ["maintainer"];
        readonly metadata: {};
    }];
}, {
    readonly name: "policy";
    readonly definitionName: "RegistryPolicy";
    readonly title: "Codex Skills Registry Policy";
    readonly description: "Project policy file used to make registry validation and MCP audits stricter in CI.";
    readonly schema: z.ZodObject<{
        extends: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
            recommended: "recommended";
            "strict-mcp": "strict-mcp";
            "plugin-review": "plugin-review";
        }>, z.ZodArray<z.ZodEnum<{
            recommended: "recommended";
            "strict-mcp": "strict-mcp";
            "plugin-review": "plugin-review";
        }>>]>>;
        requirePinnedMcpPackages: z.ZodOptional<z.ZodBoolean>;
        allowedSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deniedSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        allowedPlugins: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deniedPlugins: z.ZodOptional<z.ZodArray<z.ZodString>>;
        allowedMcpServers: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deniedMcpServers: z.ZodOptional<z.ZodArray<z.ZodString>>;
        allowedMcpCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deniedMcpCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
        allowedRemoteMcpHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deniedRemoteMcpHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requireExplicitMcpToolPolicy: z.ZodOptional<z.ZodBoolean>;
        requirePluginSkillPaths: z.ZodOptional<z.ZodBoolean>;
        failOnWarnings: z.ZodOptional<z.ZodBoolean>;
        baselineFile: z.ZodOptional<z.ZodString>;
        suppressions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            code: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodString>;
            file: z.ZodOptional<z.ZodString>;
            reason: z.ZodString;
            owner: z.ZodOptional<z.ZodString>;
            expiresOn: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    readonly examples: [{
        readonly extends: readonly ["recommended"];
        readonly failOnWarnings: false;
    }];
}, {
    readonly name: "mcp-config";
    readonly definitionName: "McpConfigFile";
    readonly title: "Codex MCP Config File";
    readonly description: "MCP server configuration file with a top-level mcp_servers object.";
    readonly schema: z.ZodObject<{
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
    readonly examples: [{
        readonly mcp_servers: {
            readonly docs_search: {
                readonly url: "https://example.com/mcp";
                readonly bearer_token_env_var: "DOCS_MCP_TOKEN";
                readonly enabled_tools: readonly ["search", "read"];
            };
        };
    }];
}, {
    readonly name: "mcp-server";
    readonly definitionName: "McpServerConfig";
    readonly title: "Codex MCP Server";
    readonly description: "Single stdio or HTTP MCP server definition accepted by codex-skills-registry.";
    readonly schema: z.ZodUnion<readonly [z.ZodObject<{
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
    readonly examples: [{
        readonly command: "node";
        readonly args: readonly ["./mcp/server.js"];
        readonly enabled_tools: readonly ["search", "read"];
        readonly default_tools_approval_mode: "prompt";
    }];
}, {
    readonly name: "plugin-manifest";
    readonly definitionName: "PluginManifest";
    readonly title: "Codex Plugin Manifest";
    readonly description: "Codex plugin manifest with registry-supported skill and MCP component references.";
    readonly schema: z.ZodObject<{
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
    readonly examples: [{
        readonly name: "maintainer-kit";
        readonly version: "0.1.0";
        readonly description: "Reusable Codex workflows for open-source maintainers.";
        readonly skills: "./skills/";
        readonly mcpServers: "./.mcp.json";
        readonly license: "MIT";
    }];
}];
export type RegistryJsonSchemaName = (typeof JSON_SCHEMA_DEFINITIONS)[number]["name"];
/**
 * Lists schema names accepted by the CLI --name option.
 *
 * @returns Stable schema name list.
 */
export declare function listRegistryJsonSchemaNames(): RegistryJsonSchemaName[];
/**
 * Checks whether a user-provided schema name is supported.
 *
 * @param name - Candidate schema name.
 * @returns True when the name maps to a known schema.
 */
export declare function isRegistryJsonSchemaName(name: string): name is RegistryJsonSchemaName;
/**
 * Creates one JSON Schema document for a supported registry shape.
 *
 * @param name - Supported schema name.
 * @returns Draft 2020-12 JSON Schema document.
 */
export declare function createRegistryJsonSchema(name: RegistryJsonSchemaName): Record<string, unknown>;
/**
 * Creates a schema catalog with every supported shape under $defs. The top
 * schema accepts any of the supported registry documents through anyOf.
 *
 * @returns Draft 2020-12 JSON Schema catalog.
 */
export declare function createRegistryJsonSchemaCatalog(): Record<string, unknown>;
export {};
