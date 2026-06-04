import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { RegistryReport } from "../src/report.js";
import { writeRegistrySite } from "../src/site.js";

const emptyReport: RegistryReport = {
  summary: {
    skills: 0,
    mcpServers: 0,
    plugins: 0,
    workflows: 0,
    errors: 0,
    warnings: 0,
  },
  skills: [],
  mcpServers: [],
  plugins: [],
  workflows: [],
  issues: [],
  nextActions: [],
};

describe("registry site", () => {
  it("writes a searchable and categorized rules page", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-site-"));

    try {
      await writeRegistrySite({
        outDir: tmp,
        report: emptyReport,
        rules: [
          {
            code: "WORKFLOW_UNPINNED_ACTION",
            title: "Unpinned workflow action",
            description: "A workflow action reference is not pinned.",
            remediation: "Pin action references to a commit SHA.",
          },
          {
            code: "MCP_SHELL_COMMAND",
            title: "Shell-based MCP command",
            description: "An MCP server launches through a shell.",
            remediation: "Use a direct executable command.",
          },
        ],
      });

      const html = await readFile(path.join(tmp, "rules.html"), "utf8");

      expect(html).toContain('id="rules-search"');
      expect(html).toContain('id="rules-category"');
      expect(html).toContain('value="WORKFLOW"');
      expect(html).toContain("data-rule-card");
      expect(html).toContain('data-category="MCP"');
      expect(html).toContain("No matching rules.");
      expect(html).toContain("dataset.ruleText.includes(query)");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
