import { describe, expect, it } from "vitest";
import { CodexSkillSchema, McpServerConfigSchema, normalizeSkillInput } from "../src/schema.js";

describe("schema", () => {
  it("normalizes legacy skillName and triggerType fields", () => {
    const skill = normalizeSkillInput({
      skillName: "issue-triage",
      version: "0.1.0",
      author: "test",
      description: "Triage GitHub issues for maintainers and prepare next actions.",
      triggerType: "issue",
      entryPoint: "scripts/run.ts"
    });

    expect(skill.name).toBe("issue-triage");
    expect(skill.triggers).toEqual(["issue"]);
    expect(CodexSkillSchema.safeParse(skill).success).toBe(true);
  });

  it("accepts stdio and HTTP MCP server configs", () => {
    expect(
      McpServerConfigSchema.safeParse({
        command: "npx",
        args: ["-y", "@upstash/context7-mcp"]
      }).success
    ).toBe(true);

    expect(
      McpServerConfigSchema.safeParse({
        url: "https://example.com/mcp",
        bearer_token_env_var: "TOKEN"
      }).success
    ).toBe(true);
  });
});
