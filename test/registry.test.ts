import { describe, expect, it } from "vitest";
import { executeMockSkill } from "../src/executor.js";
import { SkillsRegistry } from "../src/registry.js";

describe("SkillsRegistry", () => {
  it("loads examples, validates a skill, and mock-runs it", async () => {
    const registry = await SkillsRegistry.load({
      cwd: process.cwd(),
      includeExamples: true
    });

    expect(registry.listSkills()).toHaveLength(3);

    const validation = await registry.validateSkillByName("issue-triage");
    expect(validation.valid).toBe(true);

    const result = await executeMockSkill(registry, "issue-triage");
    expect(result.success).toBe(true);
    expect(result.logs.join("\n")).toContain("accepted a issue event");
  });

  it("validates plugin skill paths and names", async () => {
    const registry = await SkillsRegistry.load({
      cwd: "test/fixtures/plugin-project",
      includeExamples: false
    });

    const diagnostics = registry.listDiagnostics();

    expect(diagnostics.some((issue) => issue.message.includes("but SKILL.md declares"))).toBe(true);
    expect(diagnostics.some((issue) => issue.message.includes("is invalid"))).toBe(true);
  });
});
