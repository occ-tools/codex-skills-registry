import { describe, expect, it } from "vitest";
import {
  createRegistryReport,
  formatRegistryReportHtml,
  formatRegistryReportMarkdown,
} from "../src/report.js";

describe("report", () => {
  it("creates maintainer-facing report data", () => {
    const report = createRegistryReport({
      generatedAt: "2026-06-03T00:00:00.000Z",
      skills: [],
      mcpServers: [
        {
          name: "shell",
          sourcePath: ".codex/config.toml",
          config: {
            command: "bash",
          },
        },
      ],
      plugins: [],
      diagnostics: [
        {
          severity: "error",
          path: "mcp_servers.shell.command",
          file: ".codex/config.toml",
          line: 2,
          message: "Shell command requires review.",
        },
      ],
      policy: {
        requirePinnedMcpPackages: false,
        requireExplicitMcpToolPolicy: false,
        requirePluginSkillPaths: false,
        failOnWarnings: false,
      },
    });

    expect(report.summary.errors).toBe(1);
    expect(report.mcpServers[0]?.transport).toBe("stdio");
    expect(report.nextActions).toContain(
      "Fix error-level findings before trusting the automation.",
    );
  });

  it("formats Markdown reports", () => {
    const markdown = formatRegistryReportMarkdown({
      summary: {
        skills: 0,
        mcpServers: 0,
        plugins: 0,
        errors: 0,
        warnings: 0,
      },
      skills: [],
      mcpServers: [],
      plugins: [],
      issues: [],
      nextActions: [],
    });

    expect(markdown).toContain("# Codex Skills Registry Report");
    expect(markdown).toContain("No immediate action required.");
  });

  it("formats HTML reports", () => {
    const html = formatRegistryReportHtml({
      summary: {
        skills: 0,
        mcpServers: 0,
        plugins: 0,
        errors: 0,
        warnings: 0,
      },
      skills: [],
      mcpServers: [],
      plugins: [],
      issues: [],
      nextActions: [],
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Codex Skills Registry Report");
  });
});
