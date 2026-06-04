import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RegistryReport } from "./report.js";
import type { RegistryRuleExplanation } from "./rules.js";

export interface RegistrySiteInput {
  report: RegistryReport;
  rules: RegistryRuleExplanation[];
  generatedAt?: string;
}

export interface WriteRegistrySiteOptions extends RegistrySiteInput {
  outDir: string;
}

export interface RegistrySiteManifest {
  outDir: string;
  files: string[];
}

/**
 * Writes a static documentation site for GitHub Pages or generic artifact hosting.
 *
 * @param options - Site output directory and source report data.
 * @returns Written file manifest.
 */
export async function writeRegistrySite(
  options: WriteRegistrySiteOptions,
): Promise<RegistrySiteManifest> {
  const outDir = path.resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const files = [
    {
      name: "index.html",
      content: formatSitePage({
        title: "Codex Skills Registry",
        active: "overview",
        body: formatOverview(options),
      }),
    },
    {
      name: "rules.html",
      content: formatSitePage({
        title: "Rules",
        active: "rules",
        body: formatRules(options.rules),
      }),
    },
    {
      name: "policy.html",
      content: formatSitePage({
        title: "Policy",
        active: "policy",
        body: formatPolicy(),
      }),
    },
  ];

  for (const file of files) {
    await writeFile(path.join(outDir, file.name), file.content, "utf8");
  }

  return {
    outDir,
    files: files.map((file) => path.join(outDir, file.name)),
  };
}

function formatOverview(input: RegistrySiteInput): string {
  const report = input.report;
  return `
<section class="hero">
  <p class="eyebrow">Maintainer automation registry</p>
  <h1>Codex Skills Registry</h1>
  <p>Validate Codex Skills, plugin manifests, MCP server configuration, and GitHub Actions workflow risk before maintainers trust automation in CI.</p>
</section>
<section aria-labelledby="summary-heading">
  <h2 id="summary-heading">Current Registry Snapshot</h2>
  <div class="metric-grid">
    ${metric("Skills", report.summary.skills)}
    ${metric("MCP Servers", report.summary.mcpServers)}
    ${metric("Plugins", report.summary.plugins)}
    ${metric("Workflows", report.summary.workflows)}
    ${metric("Errors", report.summary.errors, "danger")}
    ${metric("Warnings", report.summary.warnings, "warn")}
  </div>
</section>
<section aria-labelledby="coverage-heading">
  <h2 id="coverage-heading">Coverage</h2>
  <div class="split">
    ${listSection(
      "Skills",
      report.skills.map((skill) => `${skill.name} - ${skill.description}`),
      "No skills discovered.",
    )}
    ${listSection(
      "MCP Servers",
      report.mcpServers.map(
        (server) => `${server.name} (${server.transport}) - ${server.sourcePath}`,
      ),
      "No MCP servers discovered.",
    )}
    ${listSection(
      "Plugins",
      report.plugins.map((plugin) => `${plugin.name} - ${plugin.sourcePath}`),
      "No plugin manifests discovered.",
    )}
    ${listSection(
      "Workflows",
      report.workflows.map((workflow) => `${workflow.name} - ${workflow.sourcePath}`),
      "No workflows discovered.",
    )}
  </div>
</section>
<section aria-labelledby="findings-heading">
  <h2 id="findings-heading">Findings</h2>
  ${formatFindings(report)}
</section>
<section aria-labelledby="next-heading">
  <h2 id="next-heading">Next Actions</h2>
  ${formatList(report.nextActions, "No immediate action required.")}
</section>
<p class="timestamp">Generated ${escapeHtml(input.generatedAt ?? new Date().toISOString())}</p>`;
}

function formatRules(rules: RegistryRuleExplanation[]): string {
  return `
<section class="hero compact">
  <p class="eyebrow">Rules catalog</p>
  <h1>Registry Rules</h1>
  <p>Stable issue codes, what they mean, and how maintainers should resolve them.</p>
</section>
<section class="rules">
  ${rules
    .map(
      (rule) => `
    <article class="rule" id="${escapeAttribute(rule.code)}">
      <h2><code>${escapeHtml(rule.code)}</code> ${escapeHtml(rule.title)}</h2>
      <p>${escapeHtml(rule.description)}</p>
      <p><strong>Fix:</strong> ${escapeHtml(rule.remediation)}</p>
    </article>`,
    )
    .join("")}
</section>`;
}

function formatPolicy(): string {
  return `
<section class="hero compact">
  <p class="eyebrow">Governance</p>
  <h1>Policy Model</h1>
  <p>Policy files turn advisory checks into repository-specific gates without changing the default onboarding path.</p>
</section>
<section>
  <h2>Recommended starting point</h2>
  <pre><code>extends:
  - recommended
requirePinnedWorkflowActions: false
failOnWarnings: false
suppressions:
  - code: MCP_SHELL_COMMAND
    reason: "Reviewed local-only fixture"
    expiresOn: "2099-01-01"</code></pre>
</section>
<section>
  <h2>Supply-chain strict mode</h2>
  <pre><code>extends:
  - strict-supply-chain</code></pre>
</section>`;
}

function formatSitePage(options: {
  title: string;
  active: "overview" | "rules" | "policy";
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)}</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #5b6475; --line: #d8dee8; --panel: #f7f9fb; --brand: #0f766e; --danger: #b42318; --warn: #a15c00; }
    * { box-sizing: border-box; }
    body { color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; margin: 0; background: #ffffff; }
    header { border-bottom: 1px solid var(--line); }
    nav, main { margin: 0 auto; max-width: 1120px; padding: 0 20px; }
    nav { align-items: center; display: flex; min-height: 64px; gap: 24px; }
    nav a { color: var(--muted); font-weight: 650; text-decoration: none; }
    nav a[aria-current="page"] { color: var(--brand); }
    main { padding-bottom: 48px; }
    .brand { color: var(--ink); font-size: 18px; margin-right: auto; }
    .hero { border-bottom: 1px solid var(--line); padding: 56px 0 36px; }
    .hero.compact { padding-bottom: 28px; }
    .eyebrow { color: var(--brand); font-size: 13px; font-weight: 750; letter-spacing: 0; margin: 0 0 8px; text-transform: uppercase; }
    h1 { font-size: clamp(34px, 4vw, 56px); line-height: 1.05; letter-spacing: 0; margin: 0 0 16px; max-width: 760px; }
    h2 { font-size: 22px; letter-spacing: 0; margin: 36px 0 12px; }
    p { max-width: 760px; }
    code, pre { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; }
    code { padding: 2px 5px; }
    pre { overflow-x: auto; padding: 16px; }
    pre code { border: 0; padding: 0; }
    .metric-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
    .metric { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
    .metric span { color: var(--muted); display: block; font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .metric strong { display: block; font-size: 32px; margin-top: 6px; }
    .metric.danger strong { color: var(--danger); }
    .metric.warn strong { color: var(--warn); }
    .split { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .list-block, .rule { border-top: 1px solid var(--line); padding-top: 12px; }
    ul { margin: 8px 0 0; padding-left: 20px; }
    li { margin: 6px 0; }
    .finding.error { color: var(--danger); }
    .finding.warning { color: var(--warn); }
    .timestamp { color: var(--muted); font-size: 13px; margin-top: 40px; }
    @media (max-width: 640px) { nav { align-items: flex-start; flex-direction: column; gap: 8px; padding-bottom: 16px; padding-top: 16px; } .brand { margin-right: 0; } }
  </style>
</head>
<body>
  <header>
    <nav aria-label="Primary navigation">
      <a class="brand" href="index.html">Codex Skills Registry</a>
      ${navLink("Overview", "index.html", options.active === "overview")}
      ${navLink("Rules", "rules.html", options.active === "rules")}
      ${navLink("Policy", "policy.html", options.active === "policy")}
    </nav>
  </header>
  <main>
    ${options.body}
  </main>
</body>
</html>
`;
}

function metric(label: string, value: number, tone?: "danger" | "warn"): string {
  return `<div class="metric${tone ? ` ${tone}` : ""}"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

function listSection(title: string, values: string[], empty: string): string {
  return `<section class="list-block"><h3>${escapeHtml(title)}</h3>${formatList(values, empty)}</section>`;
}

function formatFindings(report: RegistryReport): string {
  if (report.issues.length === 0) {
    return "<p>No active findings.</p>";
  }

  return `<ul>${report.issues
    .map(
      (issue) =>
        `<li class="finding ${issue.severity}"><code>${escapeHtml(issue.code ?? "REGISTRY_ISSUE")}</code> ${escapeHtml(issue.path)}: ${escapeHtml(issue.message)}</li>`,
    )
    .join("")}</ul>`;
}

function formatList(values: string[], empty: string): string {
  if (values.length === 0) {
    return `<p>${escapeHtml(empty)}</p>`;
  }

  return `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function navLink(label: string, href: string, active: boolean): string {
  return `<a href="${href}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/[^A-Za-z0-9_-]/g, "-");
}
