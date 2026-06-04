import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { auditGithubWorkflow, discoverGithubWorkflows } from "../src/workflows.js";

describe("GitHub workflow discovery and audit", () => {
  it("discovers workflow jobs and action references", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "codex-workflows-"));

    try {
      await writeWorkflow(
        root,
        "validate.yml",
        `name: validate
on:
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
      - run: npm test
`,
      );

      const result = await discoverGithubWorkflows(root);

      expect(result.diagnostics).toHaveLength(0);
      expect(result.workflows[0]?.name).toBe("validate");
      expect(result.workflows[0]?.jobs[0]?.id).toBe("test");
      expect(result.workflows[0]?.uses[0]?.value).toContain("actions/checkout");
      expect(result.workflows[0]?.runs[0]?.value).toBe("npm test");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("audits workflow permissions, pull_request_target, and unpinned actions", () => {
    const issues = auditGithubWorkflow(
      {
        name: "risky",
        sourcePath: ".github/workflows/risky.yml",
        triggers: {
          pull_request_target: {},
        },
        permissions: "write-all",
        jobs: [
          {
            id: "comment",
          },
        ],
        uses: [
          {
            value: "actions/checkout@v4",
            path: "workflows.risky.jobs.comment.steps.0.uses",
            jobId: "comment",
            line: 9,
          },
        ],
        runs: [],
      },
      {
        policy: {
          requirePinnedMcpPackages: false,
          requirePinnedWorkflowActions: true,
          requireExplicitMcpToolPolicy: false,
          requirePluginSkillPaths: false,
          failOnWarnings: false,
          suppressions: [],
        },
      },
    );

    expect(issues.map((issue) => issue.code)).toContain("WORKFLOW_BROAD_PERMISSIONS");
    expect(issues.map((issue) => issue.code)).toContain("WORKFLOW_PULL_REQUEST_TARGET");
    expect(issues.map((issue) => issue.code)).toContain("WORKFLOW_UNPINNED_ACTION");
    expect(issues.find((issue) => issue.code === "WORKFLOW_UNPINNED_ACTION")?.severity).toBe(
      "error",
    );
  });
});

async function writeWorkflow(root: string, name: string, content: string): Promise<void> {
  const workflowsDir = path.join(root, ".github", "workflows");
  await mkdir(workflowsDir, { recursive: true });
  await writeFile(path.join(workflowsDir, name), content, "utf8");
}
