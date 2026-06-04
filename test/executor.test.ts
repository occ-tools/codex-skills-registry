import { describe, expect, it } from "vitest";
import { createMockEvent, executeMockSkill } from "../src/executor.js";
import { SkillsRegistry } from "../src/registry.js";
import type { CodexSkill } from "../src/schema.js";

const skill: CodexSkill = {
  name: "dependency-review",
  description: "Review dependency update events and prepare maintainer next actions.",
  version: "0.1.0",
  triggers: ["dependency"],
  entryPoint: "scripts/run.js",
  source: "inline",
  tags: ["dependency"],
  metadata: {},
};

describe("executor", () => {
  it("creates deterministic mock events", () => {
    const event = createMockEvent(skill, {
      repository: "owner/repo",
      actor: "alice",
    });

    expect(event.id).toBe("mock-dependency-dependency-review");
    expect(event.repository).toBe("owner/repo");
    expect(event.actor).toBe("alice");
    expect(event.payload.title).toContain("dependency");
  });

  it("mock-runs registered skills without executing local code", async () => {
    const registry = new SkillsRegistry();
    registry.registerSkill(skill);

    const result = await executeMockSkill(registry, "dependency-review");

    expect(result.success).toBe(true);
    expect(result.logs.join("\n")).toContain("completed without executing arbitrary code");
  });

  it("rejects missing skills and unsupported triggers", async () => {
    const registry = new SkillsRegistry();
    registry.registerSkill(skill);

    await expect(executeMockSkill(registry, "missing")).rejects.toThrow("not registered");
    await expect(
      executeMockSkill(registry, "dependency-review", { trigger: "issue" }),
    ).rejects.toThrow("does not accept trigger");
  });
});
