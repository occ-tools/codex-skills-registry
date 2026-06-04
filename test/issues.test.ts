import { describe, expect, it } from "vitest";
import { applyIssuePolicyFilters, createIssueBaseline, issueFingerprint } from "../src/issues.js";
import type { RegistryPolicy } from "../src/policy.js";
import type { ValidationIssue } from "../src/schema.js";

const basePolicy: RegistryPolicy = {
  requirePinnedMcpPackages: false,
  requirePinnedWorkflowActions: false,
  requireExplicitMcpToolPolicy: false,
  requirePluginSkillPaths: false,
  failOnWarnings: false,
  suppressions: [],
};

describe("issue filters", () => {
  it("creates stable baseline fingerprints and filters matching findings", () => {
    const issue: ValidationIssue = {
      severity: "warning",
      code: "MCP_UNPINNED_NPX",
      path: "mcp_servers.context7.args",
      file: "config.toml",
      message: "npx MCP servers should pin package versions for reproducible CI.",
    };
    const baseline = createIssueBaseline([issue], { cwd: process.cwd() });

    expect(baseline.issues[0]?.fingerprint).toBe(issueFingerprint(issue, { cwd: process.cwd() }));

    const filtered = applyIssuePolicyFilters([issue], {
      policy: basePolicy,
      cwd: process.cwd(),
      baseline,
    });

    expect(filtered.activeIssues).toHaveLength(0);
    expect(filtered.baselineIssues).toHaveLength(1);
  });

  it("honors active suppressions and ignores expired ones", () => {
    const issue: ValidationIssue = {
      severity: "error",
      code: "MCP_SHELL_COMMAND",
      path: "mcp_servers.shell.command",
      file: ".codex/config.toml",
      message: "Shell-based MCP commands require careful review.",
    };
    const filtered = applyIssuePolicyFilters([issue], {
      policy: {
        ...basePolicy,
        suppressions: [
          {
            code: "MCP_SHELL_*",
            file: ".codex/*",
            reason: "Temporary local-only fixture",
            expiresOn: "2099-01-01",
          },
        ],
      },
      cwd: process.cwd(),
      today: new Date("2026-06-04T00:00:00.000Z"),
    });

    expect(filtered.activeIssues).toHaveLength(0);
    expect(filtered.suppressedIssues).toHaveLength(1);

    const expired = applyIssuePolicyFilters([issue], {
      policy: {
        ...basePolicy,
        suppressions: [
          {
            code: "MCP_SHELL_COMMAND",
            reason: "Old exception",
            expiresOn: "2020-01-01",
          },
        ],
      },
      today: new Date("2026-06-04T00:00:00.000Z"),
    });

    expect(expired.activeIssues).toHaveLength(1);
  });
});
