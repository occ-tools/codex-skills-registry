import { issueCode } from "./issues.js";
export function formatPullRequestComment(report, options = {}) {
    const maxFindings = options.maxFindings ?? 10;
    const status = report.summary.errors > 0
        ? "Action required"
        : report.summary.warnings > 0
            ? "Review recommended"
            : "No active findings";
    const lines = [
        "## Codex Skills Registry",
        "",
        `**${status}**`,
        "",
        "| Metric | Count |",
        "| --- | ---: |",
        `| Skills | ${report.summary.skills} |`,
        `| MCP servers | ${report.summary.mcpServers} |`,
        `| Plugins | ${report.summary.plugins} |`,
        `| Errors | ${report.summary.errors} |`,
        `| Warnings | ${report.summary.warnings} |`,
        `| Suppressed | ${options.suppressedCount ?? 0} |`,
        `| Baseline | ${options.baselineCount ?? 0} |`,
        "",
        "### Findings",
        "",
        ...formatFindingRows(report.issues, maxFindings),
        "",
        "### Next Actions",
        "",
        ...formatNextActions(report.nextActions),
        "",
        "### Artifacts",
        "",
        ...formatArtifacts(options),
    ];
    return `${lines.join("\n")}\n`;
}
function formatFindingRows(issues, maxFindings) {
    if (issues.length === 0) {
        return ["No active findings."];
    }
    const rows = issues.slice(0, maxFindings).map((issue) => {
        const location = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ""})` : "";
        const help = issue.help ? ` ${issue.help}` : "";
        return `- [${issue.severity.toUpperCase()}] ${issueCode(issue)} ${issue.path}${location}: ${issue.message}${help}`;
    });
    if (issues.length > maxFindings) {
        rows.push(`- ${issues.length - maxFindings} additional finding(s) omitted from this comment.`);
    }
    return rows;
}
function formatNextActions(nextActions) {
    if (nextActions.length === 0) {
        return ["No immediate action required."];
    }
    return nextActions.map((action) => `- ${action}`);
}
function formatArtifacts(options) {
    const rows = [];
    if (options.reportPath) {
        rows.push(`- Report: ${options.reportPath}`);
    }
    if (options.sarifPath) {
        rows.push(`- SARIF: ${options.sarifPath}`);
    }
    return rows.length > 0 ? rows : ["No artifact paths were provided."];
}
//# sourceMappingURL=pr-comment.js.map