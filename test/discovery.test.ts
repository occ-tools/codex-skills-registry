import { describe, expect, it } from "vitest";
import { discoverPluginMcpServers, discoverProject, parseSkillMarkdown } from "../src/discovery.js";

describe("discovery", () => {
  it("parses SKILL.md frontmatter", () => {
    const parsed = parseSkillMarkdown(`---
name: issue-triage
description: Triage GitHub issues for maintainers and identify next actions.
---

# Body
`);

    expect(parsed.frontmatter.name).toBe("issue-triage");
    expect(parsed.body).toContain("# Body");
  });

  it("parses SKILL.md frontmatter with a UTF-8 BOM", () => {
    const parsed = parseSkillMarkdown(`\uFEFF---
name: bom-skill
description: Validate a skill file that was saved with a byte order mark.
---

# Body
`);

    expect(parsed.frontmatter.name).toBe("bom-skill");
  });

  it("discovers bundled examples", async () => {
    const result = await discoverProject({ cwd: process.cwd(), includeExamples: true });

    expect(result.skills.map((skill) => skill.name).sort()).toEqual([
      "issue-triage",
      "pr-review",
      "release-notes"
    ]);
    expect(result.mcpServers.map((server) => server.name).sort()).toEqual([
      "context7",
      "docs_search",
      "maintainer_docs"
    ]);
    expect(result.plugins.map((plugin) => plugin.manifest.name)).toEqual(["maintainer-kit"]);
  });

  it("surfaces diagnostics for invalid skill fixtures", async () => {
    const result = await discoverProject({
      cwd: "test/fixtures/invalid-project",
      includeExamples: false
    });

    expect(result.skills).toHaveLength(0);
    expect(result.diagnostics.some((issue) => issue.severity === "error")).toBe(true);
    expect(result.diagnostics.find((issue) => issue.path.endsWith(".name"))?.line).toBe(2);
    expect(result.diagnostics.find((issue) => issue.path.endsWith(".description"))?.line).toBe(3);
  });

  it("records source line hints for discovered MCP server configs", async () => {
    const result = await discoverProject({
      cwd: "test/fixtures/invalid-project",
      includeExamples: false
    });

    const server = result.mcpServers.find((candidate) => candidate.name === "shell");

    expect(server?.line).toBe(1);
    expect(server?.fieldLines?.command).toBe(2);
    expect(server?.fieldLines?.default_tools_approval_mode).toBe(4);
  });

  it("records source line hints for inline plugin MCP servers", async () => {
    const manifestContent = `{
  "name": "inline-plugin",
  "version": "0.1.0",
  "mcpServers": {
    "inline_docs": {
      "command": "node",
      "enabled_tools": ["search"]
    }
  }
}`;
    const result = await discoverPluginMcpServers(
      process.cwd(),
      {
        name: "inline-plugin",
        version: "0.1.0",
        mcpServers: {
          inline_docs: {
            command: "node",
            enabled_tools: ["search"]
          }
        },
        mcp_servers: {}
      },
      "plugin.json",
      manifestContent
    );

    expect(result.mcpServers[0]?.line).toBe(5);
    expect(result.mcpServers[0]?.fieldLines?.command).toBe(6);
  });

  it("skips skills disabled by Codex skills.config", async () => {
    const result = await discoverProject({
      cwd: "test/fixtures/disabled-skill-project",
      includeExamples: false
    });

    expect(result.skills).toHaveLength(0);
    expect(result.diagnostics.some((issue) => issue.message.includes("disabled"))).toBe(true);
  });
});
