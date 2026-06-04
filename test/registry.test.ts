import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { executeMockSkill } from "../src/executor.js";
import { SkillsRegistry } from "../src/registry.js";

describe("SkillsRegistry", () => {
  it("loads examples, validates a skill, and mock-runs it", async () => {
    const registry = await SkillsRegistry.load({
      cwd: process.cwd(),
      includeExamples: true,
    });

    expect(registry.listSkills()).toHaveLength(3);

    const validation = await registry.validateSkillByName("issue-triage");
    expect(validation.valid).toBe(true);

    const result = await executeMockSkill(registry, "issue-triage");
    expect(result.success).toBe(true);
    expect(result.logs.join("\n")).toContain("accepted a issue event");
  });

  it("rejects mock runs with unsupported triggers", async () => {
    const registry = await SkillsRegistry.load({
      cwd: process.cwd(),
      includeExamples: true,
    });

    await expect(
      executeMockSkill(registry, "issue-triage", {
        trigger: "release",
      }),
    ).rejects.toThrow("does not accept trigger 'release'");
  });

  it("validates plugin skill paths and names", async () => {
    const registry = await SkillsRegistry.load({
      cwd: "test/fixtures/plugin-project",
      includeExamples: false,
    });

    const diagnostics = registry.listDiagnostics();

    expect(diagnostics.some((issue) => issue.message.includes("but SKILL.md declares"))).toBe(true);
    expect(diagnostics.some((issue) => issue.message.includes("is invalid"))).toBe(true);
    expect(diagnostics.some((issue) => issue.message.includes("must stay inside"))).toBe(true);
  });

  it("rejects entry points that escape a discovered skill directory during validation", async () => {
    const registry = new SkillsRegistry();
    registry.registerSkill({
      name: "escaped-entry",
      description: "A test skill with an entry point that escapes the skill directory.",
      version: "0.1.0",
      triggers: ["manual"],
      entryPoint: "../outside.js",
      rootDir: process.cwd(),
      source: "inline",
      tags: [],
      metadata: {},
    });

    const validation = await registry.validateSkillByName("escaped-entry");

    expect(validation.valid).toBe(false);
    expect(validation.issues.map((issue) => issue.path)).toContain("escaped-entry.entryPoint");
  });

  it("loads YAML skill config files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "codex-registry-yaml-"));
    const configPath = path.join(root, "skills.yaml");

    try {
      await writeFile(
        configPath,
        `skills:
  - name: yaml-skill
    description: Load a registry skill from a YAML config file.
    version: 0.1.0
    triggers:
      - manual
`,
        "utf8",
      );

      const registry = await SkillsRegistry.load({
        cwd: root,
        includeExamples: false,
        configFile: "skills.yaml",
      });

      expect(registry.getSkill("yaml-skill")).toBeDefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("applies plugin allow and deny policy diagnostics", async () => {
    const registry = await SkillsRegistry.load({
      cwd: "test/fixtures/plugin-external-project",
      includeExamples: false,
      policyFile: "policy.yaml",
    });

    expect(registry.listDiagnostics().some((issue) => issue.code === "PLUGIN_DENIED")).toBe(true);
  });
});
