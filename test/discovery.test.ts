import { describe, expect, it } from "vitest";
import { discoverProject, parseSkillMarkdown } from "../src/discovery.js";

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
