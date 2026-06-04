import { readFile } from "node:fs/promises";
import path from "node:path";
import { normalizeRepoPath } from "./utils.js";
export async function loadChangedFiles(options) {
    if (!options.changedFilesFile) {
        return undefined;
    }
    const filePath = path.resolve(options.cwd ?? process.cwd(), options.changedFilesFile);
    const content = await readFile(filePath, "utf8");
    const values = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map(normalizeRepoPath);
    return new Set(values);
}
export function filterIssuesByChangedFiles(issues, options, changedFiles) {
    if (!changedFiles) {
        return issues;
    }
    return issues.filter((issue) => issueMatchesChangedFiles(issue, options, changedFiles));
}
function issueMatchesChangedFiles(issue, options, changedFiles) {
    if (!issue.file) {
        return true;
    }
    const relative = path.isAbsolute(issue.file)
        ? path.relative(path.resolve(options.cwd ?? process.cwd()), issue.file)
        : issue.file;
    return changedFiles.has(normalizeRepoPath(relative));
}
//# sourceMappingURL=changed-files.js.map