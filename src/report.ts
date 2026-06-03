import type { ValidationIssue } from "./schema.js";
import type { RegistryIndex } from "./registry.js";

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
      warnings
    },
    skills: index.skills.map((skill) => ({
      name: skill.name,
      triggers: skill.triggers,
      source: skill.source,
      description: skill.description
    })),
    mcpServers: index.mcpServers.map((server) => ({
      name: server.name,
      sourcePath: server.sourcePath,
      transport: "url" in server.config ? "http" : "stdio"
    })),
    plugins: index.plugins.map((plugin) => ({
      name: plugin.manifest.name,
      sourcePath: plugin.sourcePath
    })),
    issues,
    nextActions: nextActionsForIssues(issues)
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
    ...formatNextActions(report.nextActions)
  ];

  return `${lines.join("\n")}\n`;
}

function formatSkillRows(reportSkills: RegistryReport["skills"]): string[] {
  if (reportSkills.length === 0) {
    return ["No skills discovered."];
  }

  return reportSkills.map(
    (skill) => `- ${skill.name} (${skill.triggers.join(", ")}) - ${skill.description}`
  );
}

function formatMcpRows(reportServers: RegistryReport["mcpServers"]): string[] {
  if (reportServers.length === 0) {
    return ["No MCP servers discovered."];
  }

  return reportServers.map(
    (server) => `- ${server.name} (${server.transport}) - ${server.sourcePath}`
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
    return `- [${issue.severity.toUpperCase()}] ${issue.path}${location}: ${issue.message}`;
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
