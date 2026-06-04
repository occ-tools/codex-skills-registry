import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatRegistryPolicyYaml,
  loadRegistryPolicy,
  resolveRegistryPolicy,
} from "../src/policy.js";
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

  it("reports an error when an explicit policy file is missing", async () => {
    const loaded = await loadRegistryPolicy(fixtureRoot, "missing-policy.yaml");

    expect(loaded.diagnostics).toHaveLength(1);
    expect(loaded.diagnostics[0]?.severity).toBe("error");
    expect(loaded.diagnostics[0]?.message).toContain("does not exist");
  });

  it("applies policy to MCP audit rules", async () => {
    const registry = await SkillsRegistry.load({
      cwd: fixtureRoot,
      includeExamples: false,
    });

    expect(registry.audit().some((issue) => issue.severity === "error")).toBe(true);
  });

  it("resolves named policy presets with local overrides", () => {
    const policy = resolveRegistryPolicy({
      extends: ["recommended"],
      failOnWarnings: true,
    });

    expect(policy.requirePinnedMcpPackages).toBe(true);
    expect(policy.requireExplicitMcpToolPolicy).toBe(true);
    expect(policy.requirePluginSkillPaths).toBe(true);
    expect(policy.failOnWarnings).toBe(true);
  });

  it("formats starter policy YAML", () => {
    const yaml = formatRegistryPolicyYaml({
      extends: ["recommended"],
      deniedMcpCommands: ["bash"],
      baselineFile: "codex-skills-baseline.json",
      failOnWarnings: false,
      suppressions: [
        {
          code: "MCP_SHELL_COMMAND",
          reason: "Local fixture reviewed by maintainers",
          expiresOn: "2099-01-01",
        },
      ],
    });

    expect(yaml).toContain("extends:");
    expect(yaml).toContain("  - recommended");
    expect(yaml).toContain("deniedMcpCommands:");
    expect(yaml).toContain("baselineFile: codex-skills-baseline.json");
    expect(yaml).toContain("suppressions:");
    expect(yaml).toContain("failOnWarnings: false");
  });
});
