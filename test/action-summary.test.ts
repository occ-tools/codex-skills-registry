import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  summarizeCliJson,
  writeGithubOutputSummary,
  writeGithubOutputSummaryFromFile,
} from "../src/action-summary.js";

describe("action summary", () => {
  it("summarizes CLI JSON shapes used by composite action outputs", () => {
    const summary = summarizeCliJson({
      diagnostics: [{ severity: "error" }],
      results: [{ issues: [{ severity: "warning" }] }],
      suppressedIssues: [{}],
      baselineIssues: [{}, {}],
    });

    expect(summary).toEqual({
      issueCount: 2,
      errorCount: 1,
      warningCount: 1,
      suppressedCount: 1,
      baselineCount: 2,
    });
  });

  it("falls back to nested report issues when no top-level issue arrays exist", () => {
    const summary = summarizeCliJson({
      report: {
        issues: [{ severity: "warning" }],
      },
    });

    expect(summary.issueCount).toBe(1);
    expect(summary.warningCount).toBe(1);
  });

  it("writes GitHub output lines", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-summary-"));
    const outputPath = path.join(tmp, "github-output.txt");
    const summaryPath = path.join(tmp, "summary.json");

    try {
      await writeFile(
        summaryPath,
        JSON.stringify({
          issues: [{ severity: "error" }],
          suppressedIssues: [{}],
        }),
        "utf8",
      );

      writeGithubOutputSummary(
        {
          issueCount: 1,
          errorCount: 1,
          warningCount: 0,
          suppressedCount: 1,
          baselineCount: 0,
        },
        outputPath,
      );
      writeGithubOutputSummaryFromFile(summaryPath, outputPath);

      const output = await readFile(outputPath, "utf8");
      expect(output).toContain("issue-count=1");
      expect(output).toContain("error-count=1");
      expect(output).toContain("suppressed-count=1");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
