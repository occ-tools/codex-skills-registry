import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadRegistryPolicy } from "../src/policy.js";
import { SkillsRegistry } from "../src/registry.js";

const fixtureRoot = path.join(process.cwd(), "test", "fixtures", "policy-project");

describe("policy", () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it("loads project policy files", async () => {
    const loaded = await loadRegistryPolicy(fixtureRoot);

    expect(loaded.policy.requirePinnedMcpPackages).toBe(true);
    expect(loaded.policy.allowedMcpCommands).toEqual(["node", "npx"]);
    expect(loaded.diagnostics).toHaveLength(0);
  });

  it("applies policy to MCP audit rules", async () => {
    const registry = await SkillsRegistry.load({
      cwd: fixtureRoot,
      includeExamples: false
    });

    expect(registry.audit().some((issue) => issue.severity === "error")).toBe(true);
  });
});
