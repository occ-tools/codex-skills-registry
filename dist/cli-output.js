import path from "node:path";
import { issueCode } from "./issues.js";
export function emitGithubAnnotations(issues, cwd) {
    for (const issue of issues) {
        const command = issue.severity === "error" ? "error" : "warning";
        const file = issueFile(issue, cwd);
        const line = issueLine(issue);
        const properties = [
            file ? `file=${escapeAnnotationProperty(file)}` : undefined,
            line ? `line=${line}` : undefined,
            `title=${escapeAnnotationProperty(`${issueCode(issue)} ${issueTitle(issue, cwd)}`)}`,
        ].filter(Boolean);
        const message = issue.help ? `${issue.message} ${issue.help}` : issue.message;
        console.error(`::${command} ${properties.join(",")}::${escapeAnnotationMessage(message)}`);
    }
}
function issueFile(issue, cwd) {
    const candidate = issue.file;
    if (typeof candidate !== "string") {
        return undefined;
    }
    if (cwd && path.isAbsolute(candidate)) {
        const relative = path.relative(path.resolve(cwd), path.resolve(candidate));
        if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
            return relative.replace(/\\/g, "/");
        }
    }
    return candidate.replace(/\\/g, "/");
}
function issueLine(issue) {
    return typeof issue.line === "number" && Number.isInteger(issue.line) && issue.line > 0
        ? issue.line
        : undefined;
}
function issueTitle(issue, cwd) {
    if (!issue.file || !cwd || !path.isAbsolute(issue.file)) {
        return issue.path.replace(/\\/g, "/");
    }
    const relative = path.relative(path.resolve(cwd), path.resolve(issue.file));
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
        return issue.path.replace(issue.file, relative.replace(/\\/g, "/"));
    }
    return issue.path.replace(/\\/g, "/");
}
function escapeAnnotationProperty(value) {
    return value
        .replace(/%/g, "%25")
        .replace(/\r/g, "%0D")
        .replace(/\n/g, "%0A")
        .replace(/,/g, "%2C");
}
function escapeAnnotationMessage(value) {
    return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
//# sourceMappingURL=cli-output.js.map