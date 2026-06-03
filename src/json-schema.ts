import { z, type ZodType } from "zod";
import { RegistryPolicyInputSchema } from "./policy.js";
import {
  CodexSkillSchema,
  McpConfigFileSchema,
  McpServerConfigSchema,
  PluginManifestSchema,
  SkillFrontmatterSchema
} from "./schema.js";

export const JSON_SCHEMA_BASE_ID =
  "https://wangjiehu.github.io/codex-skills-registry/schemas";

interface JsonSchemaDefinition {
  name: string;
  definitionName: string;
  title: string;
  description: string;
  schema: ZodType;
  examples: unknown[];
}

const JSON_SCHEMA_DEFINITIONS = [
  {
    name: "skill-frontmatter",
    definitionName: "SkillFrontmatter",
    title: "Codex Skill Frontmatter",
    description:
      "YAML frontmatter accepted in a Codex Skill SKILL.md file by codex-skills-registry.",
    schema: SkillFrontmatterSchema,
    examples: [
      {
        name: "issue-triage",
        description: "Triage GitHub issues and prepare maintainer next actions.",
        version: "0.1.0",
        triggers: ["issue"],
        entryPoint: "scripts/run.ts",
        tags: ["maintainer", "triage"]
      }
    ]
  },
  {
    name: "skill",
    definitionName: "CodexSkill",
    title: "Normalized Codex Skill",
    description:
      "Normalized registry entry produced from SKILL.md, config files, plugin bundles, or inline SDK records.",
    schema: CodexSkillSchema,
    examples: [
      {
        name: "issue-triage",
        description: "Triage GitHub issues and prepare maintainer next actions.",
        version: "0.1.0",
        triggers: ["issue"],
        source: "project",
        tags: ["maintainer"],
        metadata: {}
      }
    ]
  },
  {
    name: "policy",
    definitionName: "RegistryPolicy",
    title: "Codex Skills Registry Policy",
    description:
      "Project policy file used to make registry validation and MCP audits stricter in CI.",
    schema: RegistryPolicyInputSchema,
    examples: [
      {
        extends: ["recommended"],
        failOnWarnings: false
      }
    ]
  },
  {
    name: "mcp-config",
    definitionName: "McpConfigFile",
    title: "Codex MCP Config File",
    description:
      "MCP server configuration file with a top-level mcp_servers object.",
    schema: McpConfigFileSchema,
    examples: [
      {
        mcp_servers: {
          docs_search: {
            url: "https://example.com/mcp",
            bearer_token_env_var: "DOCS_MCP_TOKEN",
            enabled_tools: ["search", "read"]
          }
        }
      }
    ]
  },
  {
    name: "mcp-server",
    definitionName: "McpServerConfig",
    title: "Codex MCP Server",
    description:
      "Single stdio or HTTP MCP server definition accepted by codex-skills-registry.",
    schema: McpServerConfigSchema,
    examples: [
      {
        command: "node",
        args: ["./mcp/server.js"],
        enabled_tools: ["search", "read"],
        default_tools_approval_mode: "prompt"
      }
    ]
  },
  {
    name: "plugin-manifest",
    definitionName: "PluginManifest",
    title: "Codex Plugin Manifest",
    description:
      "Codex plugin manifest with registry-supported skill and MCP component references.",
    schema: PluginManifestSchema,
    examples: [
      {
        name: "maintainer-kit",
        version: "0.1.0",
        description: "Reusable Codex workflows for open-source maintainers.",
        skills: "./skills/",
        mcpServers: "./.mcp.json",
        license: "MIT"
      }
    ]
  }
] as const satisfies readonly JsonSchemaDefinition[];

export type RegistryJsonSchemaName = (typeof JSON_SCHEMA_DEFINITIONS)[number]["name"];

/**
 * Lists schema names accepted by the CLI --name option.
 *
 * @returns Stable schema name list.
 */
export function listRegistryJsonSchemaNames(): RegistryJsonSchemaName[] {
  return JSON_SCHEMA_DEFINITIONS.map((definition) => definition.name);
}

/**
 * Checks whether a user-provided schema name is supported.
 *
 * @param name - Candidate schema name.
 * @returns True when the name maps to a known schema.
 */
export function isRegistryJsonSchemaName(name: string): name is RegistryJsonSchemaName {
  return listRegistryJsonSchemaNames().includes(name as RegistryJsonSchemaName);
}

/**
 * Creates one JSON Schema document for a supported registry shape.
 *
 * @param name - Supported schema name.
 * @returns Draft 2020-12 JSON Schema document.
 */
export function createRegistryJsonSchema(name: RegistryJsonSchemaName): Record<string, unknown> {
  const definition = JSON_SCHEMA_DEFINITIONS.find((candidate) => candidate.name === name);
  if (!definition) {
    throw new Error(`Unknown registry schema '${name}'.`);
  }

  return createJsonSchemaForDefinition(definition);
}

/**
 * Creates a schema catalog with every supported shape under $defs. The top
 * schema accepts any of the supported registry documents through anyOf.
 *
 * @returns Draft 2020-12 JSON Schema catalog.
 */
export function createRegistryJsonSchemaCatalog(): Record<string, unknown> {
  const defs = Object.fromEntries(
    JSON_SCHEMA_DEFINITIONS.map((definition) => [
      definition.definitionName,
      toNestedDefinition(createJsonSchemaForDefinition(definition), definition.definitionName)
    ])
  );
  const refs = JSON_SCHEMA_DEFINITIONS.map((definition) => ({
    $ref: `#/$defs/${definition.definitionName}`
  }));

  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${JSON_SCHEMA_BASE_ID}/codex-skills-registry.schema.json`,
    title: "Codex Skills Registry JSON Schema Catalog",
    description:
      "JSON Schemas for Codex Skill frontmatter, normalized registry entries, registry policy files, plugin manifests, and MCP server configuration supported by codex-skills-registry.",
    anyOf: refs,
    $defs: defs
  };
}

function createJsonSchemaForDefinition(definition: JsonSchemaDefinition): Record<string, unknown> {
  const generated = removeStandardMetadata(
    z.toJSONSchema(definition.schema, {
      target: "draft-2020-12",
      io: "input",
      unrepresentable: "any",
      cycles: "ref",
      reused: "ref"
    })
  ) as Record<string, unknown>;

  return {
    ...generated,
    $id: `${JSON_SCHEMA_BASE_ID}/${definition.name}.schema.json`,
    title: definition.title,
    description: definition.description,
    examples: definition.examples
  };
}

function toNestedDefinition(
  schema: Record<string, unknown>,
  definitionName: string
): Record<string, unknown> {
  const { $schema: _schema, $id: _id, ...nestedSchema } = schema;
  return rewriteLocalJsonSchemaRefs(nestedSchema, definitionName) as Record<string, unknown>;
}

function rewriteLocalJsonSchemaRefs(value: unknown, definitionName: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteLocalJsonSchemaRefs(item, definitionName));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        key === "$ref" && typeof nestedValue === "string"
          ? rewriteLocalJsonSchemaRef(nestedValue, definitionName)
          : rewriteLocalJsonSchemaRefs(nestedValue, definitionName)
      ])
    );
  }

  return value;
}

function rewriteLocalJsonSchemaRef(ref: string, definitionName: string): string {
  return ref.startsWith("#/$defs/")
    ? ref.replace("#/$defs/", `#/$defs/${definitionName}/$defs/`)
    : ref;
}

function removeStandardMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeStandardMetadata);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "~standard")
        .map(([key, nestedValue]) => [key, removeStandardMetadata(nestedValue)])
    );
  }

  return value;
}
