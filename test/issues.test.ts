import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  applyIssuePolicyFilters,
  createIssueBaseline,
  issueCode,
  issueFingerprint,
} from "../src/issues.js";
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

  it("keeps baseline fingerprints stable when wording changes", () => {
    const issue: ValidationIssue = {
      severity: "warning",
      code: "MCP_UNPINNED_NPX",
      path: "mcp_servers.context7.args",
      file: "config.toml",
      message: "npx MCP servers should pin package versions for reproducible CI.",
    };
    const rewordedIssue: ValidationIssue = {
      ...issue,
      message: "Pin npx MCP package versions for reproducible CI.",
    };

    expect(issueFingerprint(issue, { cwd: process.cwd() })).toBe(
      issueFingerprint(rewordedIssue, { cwd: process.cwd() }),
    );
  });

  it("continues to honor legacy baselines that included message text", () => {
    const issue: ValidationIssue = {
      severity: "warning",
      code: "MCP_UNPINNED_NPX",
      path: "mcp_servers.context7.args",
      file: "config.toml",
      message: "npx MCP servers should pin package versions for reproducible CI.",
    };
    const legacyFingerprint = createHash("sha256")
      .update([issue.code, issue.path, issue.file, issue.message].join("\n"))
      .digest("hex");

    const filtered = applyIssuePolicyFilters([issue], {
      policy: basePolicy,
      cwd: process.cwd(),
      baseline: {
        version: 1,
        generatedAt: "2026-06-04T00:00:00.000Z",
        issues: [
          {
            fingerprint: legacyFingerprint,
            code: issue.code,
            path: issue.path,
            file: issue.file,
            message: issue.message,
          },
        ],
      },
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

  it("uses predictable glob semantics for suppressions", () => {
    const issue: ValidationIssue = {
      severity: "error",
      code: "SKILL_MARKDOWN_INVALID",
      path: "skillA.frontmatter",
      file: ".agents/skills/skillA/SKILL.md",
      message: "Invalid skill Markdown.",
    };

    const singleSegment = applyIssuePolicyFilters([issue], {
      policy: {
        ...basePolicy,
        suppressions: [
          {
            file: ".agents/*/SKILL.md",
            reason: "Should not cross directory boundaries",
          },
        ],
      },
      cwd: process.cwd(),
    });
    const multiSegment = applyIssuePolicyFilters([issue], {
      policy: {
        ...basePolicy,
        suppressions: [
          {
            file: ".agents/**/SKILL.md",
            reason: "Reviewed generated fixture",
          },
        ],
      },
      cwd: process.cwd(),
    });
    const singleCharacter = applyIssuePolicyFilters([issue], {
      policy: {
        ...basePolicy,
        suppressions: [
          {
            path: "skill?.frontmatter",
            reason: "Reviewed single skill fixture",
          },
        ],
      },
      cwd: process.cwd(),
    });

    expect(singleSegment.activeIssues).toHaveLength(1);
    expect(multiSegment.suppressedIssues).toHaveLength(1);
    expect(singleCharacter.suppressedIssues).toHaveLength(1);
  });

  it("creates issue codes in linear time for long separator runs", () => {
    const code = issueCode({
      severity: "warning",
      path: `C:\\${"_".repeat(100_000)}alpha${"_".repeat(100_000)}beta`,
      message: "Long path.",
    });

    expect(code).toBe("REGISTRY_ALPHA_BETA");
  });
});
