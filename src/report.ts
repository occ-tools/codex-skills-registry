import type { ValidationIssue } from "./schema.js";
import type { RegistryIndex } from "./registry.js";
import { issueCode } from "./issues.js";

export interface RegistryReportSummary {
  skills: number;
  mcpServers: number;
  plugins: number;
  errors: number;
  warnings: number;
}

export interface RegistryReport {
  summary: RegistryReportSummary;
  skills: Array<{
    name: string;
    triggers: string[];
    source: string;
    description: string;
  }>;
  mcpServers: Array<{
    name: string;
    sourcePath: string;
    transport: "stdio" | "http";
  }>;
  plugins: Array<{
    name: string;
    sourcePath: string;
  }>;
  issues: ValidationIssue[];
  nextActions: string[];
}

/**
 * Creates a maintainer-facing report from a registry index.
 *
 * @param index - Registry snapshot, preferably with project-relative paths.
 * @returns Structured report data.
 */
export function createRegistryReport(index: RegistryIndex): RegistryReport {
  const issues = index.diagnostics;
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;

  return {
    summary: {
      skills: index.skills.length,
      mcpServers: index.mcpServers.length,
      plugins: index.plugins.length,
      errors,
      warnings,
    },
    skills: index.skills.map((skill) => ({
      name: skill.name,
      triggers: skill.triggers,
      source: skill.source,
      description: skill.description,
    })),
    mcpServers: index.mcpServers.map((server) => ({
      name: server.name,
      sourcePath: server.sourcePath,
      transport: "url" in server.config ? "http" : "stdio",
    })),
    plugins: index.plugins.map((plugin) => ({
      name: plugin.manifest.name,
      sourcePath: plugin.sourcePath,
    })),
    issues,
    nextActions: nextActionsForIssues(issues),
  };
}

/**
 * Formats a registry report as Markdown for CI artifacts, pull requests, or
 * generated repository documentation.
 *
 * @param report - Report data.
 * @returns Markdown report.
 */
export function formatRegistryReportMarkdown(report: RegistryReport): string {
  const lines = [
    "# Codex Skills Registry Report",
    "",
    "## Summary",
    "",
    `- Skills: ${report.summary.skills}`,
    `- MCP servers: ${report.summary.mcpServers}`,
    `- Plugins: ${report.summary.plugins}`,
    `- Errors: ${report.summary.errors}`,
    `- Warnings: ${report.summary.warnings}`,
    "",
    "## Skills",
    "",
    ...formatSkillRows(report.skills),
    "",
    "## MCP Servers",
    "",
    ...formatMcpRows(report.mcpServers),
    "",
    "## Plugins",
    "",
    ...formatPluginRows(report.plugins),
    "",
    "## Findings",
    "",
    ...formatIssueRows(report.issues),
    "",
    "## Next Actions",
    "",
    ...formatNextActions(report.nextActions),
  ];

  return `${lines.join("\n")}\n`;
}

export function formatRegistryReportHtml(report: RegistryReport): string {
  const findings =
    report.issues.length === 0
      ? "<p>No findings.</p>"
      : `<ul>${report.issues.map((issue) => `<li>${escapeHtml(`[${issue.severity.toUpperCase()}] ${issueCode(issue)} ${issue.path}: ${issue.message}${issue.help ? ` ${issue.help}` : ""}`)}</li>`).join("")}</ul>`;
  const skills =
    report.skills.length === 0
      ? "<p>No skills discovered.</p>"
      : `<ul>${report.skills.map((skill) => `<li><strong>${escapeHtml(skill.name)}</strong> (${escapeHtml(skill.triggers.join(", "))}) - ${escapeHtml(skill.description)}</li>`).join("")}</ul>`;
  const mcpServers =
    report.mcpServers.length === 0
      ? "<p>No MCP servers discovered.</p>"
      : `<ul>${report.mcpServers.map((server) => `<li><strong>${escapeHtml(server.name)}</strong> (${server.transport}) - ${escapeHtml(server.sourcePath)}</li>`).join("")}</ul>`;
  const plugins =
    report.plugins.length === 0
      ? "<p>No plugin manifests discovered.</p>"
      : `<ul>${report.plugins.map((plugin) => `<li><strong>${escapeHtml(plugin.name)}</strong> - ${escapeHtml(plugin.sourcePath)}</li>`).join("")}</ul>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Codex Skills Registry Report</title>
  <style>
    body { color: #1f2937; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; margin: 0; }
    main { margin: 0 auto; max-width: 960px; padding: 32px 20px; }
    h1, h2 { line-height: 1.2; }
    table { border-collapse: collapse; margin: 16px 0 28px; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; border-radius: 4px; padding: 2px 4px; }
  </style>
</head>
<body>
  <main>
    <h1>Codex Skills Registry Report</h1>
    <h2>Summary</h2>
    <table>
      <tbody>
        <tr><th>Skills</th><td>${report.summary.skills}</td></tr>
        <tr><th>MCP servers</th><td>${report.summary.mcpServers}</td></tr>
        <tr><th>Plugins</th><td>${report.summary.plugins}</td></tr>
        <tr><th>Errors</th><td>${report.summary.errors}</td></tr>
        <tr><th>Warnings</th><td>${report.summary.warnings}</td></tr>
      </tbody>
    </table>
    <h2>Skills</h2>
    ${skills}
    <h2>MCP Servers</h2>
    ${mcpServers}
    <h2>Plugins</h2>
    ${plugins}
    <h2>Findings</h2>
    ${findings}
  </main>
</body>
</html>
`;
}

function formatSkillRows(reportSkills: RegistryReport["skills"]): string[] {
  if (reportSkills.length === 0) {
    return ["No skills discovered."];
  }

  return reportSkills.map(
    (skill) => `- ${skill.name} (${skill.triggers.join(", ")}) - ${skill.description}`,
  );
}

function formatMcpRows(reportServers: RegistryReport["mcpServers"]): string[] {
  if (reportServers.length === 0) {
    return ["No MCP servers discovered."];
  }

  return reportServers.map(
    (server) => `- ${server.name} (${server.transport}) - ${server.sourcePath}`,
  );
}

function formatPluginRows(reportPlugins: RegistryReport["plugins"]): string[] {
  if (reportPlugins.length === 0) {
    return ["No plugin manifests discovered."];
  }

  return reportPlugins.map((plugin) => `- ${plugin.name} - ${plugin.sourcePath}`);
}

function formatIssueRows(issues: ValidationIssue[]): string[] {
  if (issues.length === 0) {
    return ["No findings."];
  }

  return issues.map((issue) => {
    const location = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ""})` : "";
    const help = issue.help ? ` ${issue.help}` : "";
    return `- [${issue.severity.toUpperCase()}] ${issueCode(issue)} ${issue.path}${location}: ${issue.message}${help}`;
  });
}

function formatNextActions(nextActions: string[]): string[] {
  if (nextActions.length === 0) {
    return ["No immediate action required."];
  }

  return nextActions.map((action) => `- ${action}`);
}

function nextActionsForIssues(issues: ValidationIssue[]): string[] {
  if (issues.length === 0) {
    return [];
  }

  const actions = new Set<string>();
  if (issues.some((issue) => issue.severity === "error")) {
    actions.add("Fix error-level findings before trusting the automation.");
  }
  if (issues.some((issue) => issue.path.includes("mcp_servers"))) {
    actions.add("Review MCP command, transport, and tool exposure policy.");
  }
  if (issues.some((issue) => issue.path.includes("SKILL.md"))) {
    actions.add("Fix invalid SKILL.md frontmatter or missing skill metadata.");
  }
  if (issues.some((issue) => issue.path.includes("plugin"))) {
    actions.add("Review plugin paths and bundled skill references.");
  }

  return [...actions];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
