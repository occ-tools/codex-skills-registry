import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("keeps the composite action wired to tested helper scripts", async () => {
    const action = await readFile(path.join(process.cwd(), "action.yml"), "utf8");
    const dollar = "$";

    expect(action).toContain("[[ -f dist/cli.js && -f dist/action-summary.js ]]");
    expect(action).toContain(
      `text_args=("${dollar}{base_args[@]}" --format text --github-annotations)`,
    );
    expect(action).toContain(`write_issue_outputs pr-comment "${dollar}{strict_args[@]}"`);
    expect(action).toContain('node dist/action-summary.js "$summary_file"');
  });

  it("keeps PR comments on trusted action code while scanning pull request contents", async () => {
    const workflow = await readFile(
      path.join(process.cwd(), ".github", "workflows", "registry-pr-comment.yml"),
      "utf8",
    );

    expect(workflow).toContain("pull_request_target:");
    expect(workflow).toContain("path: action");
    expect(workflow).toContain("path: target");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("uses: ./action");
    expect(workflow).toContain("path: target");
  });

  it("uses the typed npm pack parser in the release workflow", async () => {
    const workflow = await readFile(
      path.join(process.cwd(), ".github", "workflows", "release.yml"),
      "utf8",
    );

    expect(workflow).toContain("node dist/npm-pack-output.js npm-pack.json");
    expect(workflow).not.toContain("node <<'NODE'");
  });
});

async function writeWorkflow(root: string, name: string, content: string): Promise<void> {
  const workflowsDir = path.join(root, ".github", "workflows");
  await mkdir(workflowsDir, { recursive: true });
  await writeFile(path.join(workflowsDir, name), content, "utf8");
}
