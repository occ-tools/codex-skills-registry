import { describe, expect, it } from "vitest";
import {
  createRegistryJsonSchema,
  createRegistryJsonSchemaCatalog,
  listRegistryJsonSchemaNames,
} from "../src/json-schema.js";

describe("json schema export", () => {
  it("creates a catalog with all supported registry schemas", () => {
    const catalog = createRegistryJsonSchemaCatalog();
    const defs = catalog.$defs as Record<string, unknown>;

    expect(catalog.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(defs.SkillFrontmatter).toBeDefined();
    expect(defs.CodexSkill).toBeDefined();
    expect(defs.RegistryPolicy).toBeDefined();
    expect(defs.McpConfigFile).toBeDefined();
    expect(defs.McpServerConfig).toBeDefined();
    expect(defs.PluginManifest).toBeDefined();
    expect(JSON.stringify(catalog)).toContain("Codex Skills Registry JSON Schema Catalog");
  });

  it("embeds catalog definitions without external resource ids", () => {
    const catalog = createRegistryJsonSchemaCatalog();
    const defs = catalog.$defs as Record<string, Record<string, unknown>>;
    const skillFrontmatter = defs.SkillFrontmatter;

    expect(skillFrontmatter?.$id).toBeUndefined();
    expect(JSON.stringify(skillFrontmatter)).toContain("#/$defs/SkillFrontmatter/$defs/__schema0");
  });

  it("exports a named schema document", () => {
    const schema = createRegistryJsonSchema("policy");

    expect(schema.$id).toContain("/policy.schema.json");
    expect(schema.title).toBe("Codex Skills Registry Policy");
    expect(JSON.stringify(schema)).toContain("requirePinnedMcpPackages");
    expect(JSON.stringify(schema)).toContain("requirePinnedWorkflowActions");
  });

  it("lists stable CLI schema names", () => {
    expect(listRegistryJsonSchemaNames()).toEqual([
      "skill-frontmatter",
      "skill",
      "policy",
      "mcp-config",
      "mcp-server",
      "plugin-manifest",
    ]);
  });
});
