#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface IssueLike {
  severity?: string;
}

export interface ActionIssueSummary {
  issueCount: number;
  errorCount: number;
  warningCount: number;
  suppressedCount: number;
  baselineCount: number;
}

export function summarizeCliJson(data: unknown): ActionIssueSummary {
  const value = isRecord(data) ? data : {};
  const issues = collectIssueArrays(value).flat();
  const suppressed = arrayValue(value.suppressedIssues);
  const baseline = arrayValue(value.baselineIssues);
  const errors = issues.filter((issue) => isRecord(issue) && issue.severity === "error").length;
  const warnings = issues.filter((issue) => isRecord(issue) && issue.severity === "warning").length;

  return {
    issueCount: issues.length,
    errorCount: errors,
    warningCount: warnings,
    suppressedCount: suppressed.length,
    baselineCount: baseline.length,
  };
}

export function writeGithubOutputSummary(
  summary: ActionIssueSummary,
  outputPath = process.env.GITHUB_OUTPUT,
): void {
  if (!outputPath) {
    throw new Error("GITHUB_OUTPUT is not set.");
  }

  appendFileSync(
    outputPath,
    `${[
      `issue-count=${summary.issueCount}`,
      `error-count=${summary.errorCount}`,
      `warning-count=${summary.warningCount}`,
      `suppressed-count=${summary.suppressedCount}`,
      `baseline-count=${summary.baselineCount}`,
    ].join("\n")}\n`,
  );
}

export function writeGithubOutputSummaryFromFile(
  summaryFile: string,
  outputPath = process.env.GITHUB_OUTPUT,
): void {
  const data = JSON.parse(readFileSync(summaryFile, "utf8")) as unknown;
  writeGithubOutputSummary(summarizeCliJson(data), outputPath);
}

function collectIssueArrays(value: Record<string, unknown>): IssueLike[][] {
  const directArrays = [
    arrayValue(value.diagnostics),
    arrayValue(value.validationIssues),
    arrayValue(value.auditIssues),
    arrayValue(value.issues),
  ];
  const results = arrayValue(value.results);
  const resultIssues = results.flatMap((result) =>
    isRecord(result) ? arrayValue(result.issues) : [],
  );
  const arrays =
    directArrays.some((issues) => issues.length > 0) || resultIssues.length > 0
      ? directArrays
      : [isRecord(value.report) ? arrayValue(value.report.issues) : []];

  return [...arrays, resultIssues].filter((issues) => issues.length > 0);
}

function arrayValue(value: unknown): IssueLike[] {
  return Array.isArray(value) ? (value as IssueLike[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const summaryFile = process.argv[2];
  if (!summaryFile) {
    console.error("Usage: action-summary <summary-json-file>");
    process.exitCode = 2;
  } else {
    try {
      writeGithubOutputSummaryFromFile(summaryFile);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
