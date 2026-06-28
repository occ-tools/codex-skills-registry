import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ValidationIssue } from "./schema.js";
import { normalizeRepoPath, resolvePathInside } from "./utils.js";

export interface ChangedFilesOptions {
  cwd?: string;
  changedFilesFile?: string;
}

export async function loadChangedFiles(
  options: ChangedFilesOptions,
): Promise<Set<string> | undefined> {
  if (!options.changedFilesFile) {
    return undefined;
  }

  const filePath = resolvePathInside(
    options.cwd ?? process.cwd(),
    options.changedFilesFile,
    "changed-files path",
  );
  const content = await readFile(filePath, "utf8");
  const values = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map(normalizeRepoPath);

  return new Set(values);
}

export function filterIssuesByChangedFiles(
  issues: ValidationIssue[],
  options: ChangedFilesOptions,
  changedFiles: Set<string> | undefined,
): ValidationIssue[] {
  if (!changedFiles) {
    return issues;
  }

  return issues.filter((issue) => issueMatchesChangedFiles(issue, options, changedFiles));
}

function issueMatchesChangedFiles(
  issue: ValidationIssue,
  options: ChangedFilesOptions,
  changedFiles: Set<string>,
): boolean {
  if (!issue.file) {
    return true;
  }

  const relative = path.isAbsolute(issue.file)
    ? path.relative(path.resolve(options.cwd ?? process.cwd()), issue.file)
    : issue.file;
  return changedFiles.has(normalizeRepoPath(relative));
}
