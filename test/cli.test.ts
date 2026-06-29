import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.js";

describe("CLI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.exitCode = undefined;
  });

  it("lists bundled example skills through the command API", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "--cwd", process.cwd(), "list"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("issue-triage");
    expect(output).toContain("release-notes");
  });

  it("prints JSON doctor output", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "--cwd", process.cwd(), "--format", "json", "doctor"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as { summary: { skills: number; auditIssues: number } };
    expect(parsed.summary.skills).toBe(3);
    expect(parsed.summary.auditIssues).toBe(0);
  });

  it("prints project-relative issue paths in JSON doctor output", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "--format",
      "json",
      "doctor",
      "--strict",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).not.toContain(process.cwd());
    expect(output).toContain(".agents/skills/bad-skill/SKILL.md");
    expect(process.exitCode).toBe(1);
  });

  it("prints SARIF output for doctor", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "--format",
      "sarif",
      "doctor",
      "--strict",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as {
      version: string;
      runs: Array<{
        results: Array<{
          ruleId: string;
          locations?: Array<{
            physicalLocation: {
              artifactLocation: { uri: string };
              region: { startLine: number };
            };
          }>;
        }>;
      }>;
    };
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs[0]?.results.length).toBeGreaterThan(0);
    expect(
      parsed.runs[0]?.results[0]?.locations?.[0]?.physicalLocation.artifactLocation.uri,
    ).not.toContain(process.cwd());
    const shellCommandResult = parsed.runs[0]?.results.find(
      (result) => result.ruleId === "MCP_SHELL_COMMAND",
    );
    expect(shellCommandResult?.locations?.[0]?.physicalLocation.artifactLocation.uri).toBe(
      ".codex/config.toml",
    );
    expect(shellCommandResult?.locations?.[0]?.physicalLocation.region.startLine).toBe(2);
    expect(process.exitCode).toBe(1);
  });

  it("honors JSON output for the list subcommand", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "--cwd", process.cwd(), "--format", "json", "list"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as { skills: Array<{ name: string }> };
    expect(parsed.skills.map((skill) => skill.name)).toContain("issue-triage");
  });

  it("fails validate when discovery diagnostics are present", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "validate",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("Diagnostics:");
    expect(output).toContain("SKILL.md");
    expect(output).toContain("[ERROR] .agents/skills/bad-skill/SKILL.md.name");
    expect(output).toContain(".agents/skills/bad-skill/SKILL.md:2");
    expect(output).not.toContain(`${process.cwd()}\\test`);
    expect(process.exitCode).toBe(1);
  });

  it("applies failOnWarnings to full-registry validation", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-warning-policy-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await mkdir(path.join(tmp, ".agents", "skills", "missing-file"), { recursive: true });
      await writeFile(
        path.join(tmp, ".codex-skills-registry.yaml"),
        "failOnWarnings: true\n",
        "utf8",
      );

      await runCli(["node", "codex-skills", "--cwd", tmp, "--no-examples", "validate"]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("SKILL_FILE_MISSING");
      expect(process.exitCode).toBe(1);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("separates baseline load diagnostics from discovery diagnostics", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "--baseline",
      "missing-baseline.json",
      "validate",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("Baseline diagnostics:");
    expect(output.match(/^Diagnostics:$/gm) ?? []).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it("reports strict audit errors for risky fixtures", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "audit",
      "--strict",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("Shell-based MCP commands require careful review");
    expect(process.exitCode).toBe(1);
  });

  it("filters doctor findings by changed files", async () => {
    const sourceFixtureRoot = path.join(process.cwd(), "test", "fixtures", "invalid-project");
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-changed-"));
    const fixtureRoot = path.join(tmp, "invalid-project");
    const changedFilesPath = path.join(fixtureRoot, "changed-files.txt");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await cp(sourceFixtureRoot, fixtureRoot, { recursive: true });
      await writeFile(changedFilesPath, ".codex/config.toml\n", "utf8");
      await runCli([
        "node",
        "codex-skills",
        "--cwd",
        fixtureRoot,
        "--no-examples",
        "--changed-files",
        "changed-files.txt",
        "doctor",
        "--strict",
      ]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("mcp_servers.shell.command");
      expect(output).not.toContain("bad-skill");
      expect(process.exitCode).toBe(1);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("rejects changed-files inputs outside the project", async () => {
    await expect(
      runCli([
        "node",
        "codex-skills",
        "--cwd",
        "test/fixtures/invalid-project",
        "--no-examples",
        "--changed-files",
        "../changed-files.txt",
        "doctor",
      ]),
    ).rejects.toThrow("changed-files path must stay inside");
  });

  it("rejects changed-files inputs that resolve outside the project", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "codex-skills-changed-symlink-"));
    const outside = await mkdtemp(path.join(tmpdir(), "codex-skills-changed-outside-"));

    try {
      await writeFile(path.join(outside, "changed-files.txt"), ".codex/config.toml\n", "utf8");
      await symlink(
        outside,
        path.join(root, "linked"),
        process.platform === "win32" ? "junction" : "dir",
      );

      await expect(
        runCli([
          "node",
          "codex-skills",
          "--cwd",
          root,
          "--no-examples",
          "--changed-files",
          "linked/changed-files.txt",
          "doctor",
        ]),
      ).rejects.toThrow("changed-files path must resolve inside");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("emits GitHub annotations to stderr", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "--github-annotations",
      "doctor",
      "--strict",
    ]);

    const output = error.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("::error");
    expect(output).toContain("file=.codex/config.toml,line=2");
    expect(output).toContain(
      "title=SCHEMA_VALIDATION_FAILED .agents/skills/bad-skill/SKILL.md.name",
    );
    expect(output).toContain("Shell-based MCP commands require careful review");
    expect(process.exitCode).toBe(1);
  });

  it("writes JSON Schema output", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-schema-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await runCli(["node", "codex-skills", "--cwd", tmp, "schema", "--out", "schema.json"]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      const parsed = JSON.parse(await readFile(path.join(tmp, "schema.json"), "utf8")) as {
        $defs: Record<string, unknown>;
      };

      expect(output).toContain("Exported JSON Schema");
      expect(parsed.$defs.RegistryPolicy).toBeDefined();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("rejects config inputs outside the project", async () => {
    await expect(
      runCli([
        "node",
        "codex-skills",
        "--cwd",
        "test/fixtures/plugin-project",
        "--no-examples",
        "--config",
        "../external-config.yaml",
        "list",
      ]),
    ).rejects.toThrow("config path must stay inside");
  });

  it("exports registry indexes with project-relative paths", async () => {
    const sourceFixtureRoot = path.join(process.cwd(), "test", "fixtures", "invalid-project");
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-export-"));
    const fixtureRoot = path.join(tmp, "invalid-project");
    const outFile = path.join(fixtureRoot, "registry-index.json");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await cp(sourceFixtureRoot, fixtureRoot, { recursive: true });
      await runCli([
        "node",
        "codex-skills",
        "--cwd",
        fixtureRoot,
        "--no-examples",
        "export",
        "--out",
        "registry-index.json",
      ]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      const parsed = JSON.parse(await readFile(outFile, "utf8")) as {
        mcpServers: Array<{ sourcePath: string }>;
        diagnostics: Array<{ file?: string; path: string }>;
      };

      expect(output).toContain("Exported registry index");
      expect(parsed.mcpServers[0]?.sourcePath).toBe(".codex/config.toml");
      expect(JSON.stringify(parsed)).not.toContain(process.cwd());
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("prints Markdown registry reports", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "--cwd", process.cwd(), "report"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("# Codex Skills Registry Report");
    expect(output).toContain("issue-triage");
  });

  it("prints HTML registry reports", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "--cwd", process.cwd(), "report", "--html"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("<!doctype html>");
    expect(output).toContain("Codex Skills Registry Report");
  });

  it("writes static registry sites", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-site-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await runCli(["node", "codex-skills", "--cwd", tmp, "--no-examples", "site"]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      const html = await readFile(path.join(tmp, "site", "index.html"), "utf8");
      const rules = await readFile(path.join(tmp, "site", "rules.html"), "utf8");

      expect(output).toContain("Wrote registry site");
      expect(html).toContain("Codex Skills Registry");
      expect(rules).toContain("WORKFLOW_UNPINNED_ACTION");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("writes starter policy files", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-policy-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await runCli([
        "node",
        "codex-skills",
        "--cwd",
        tmp,
        "init-policy",
        "--preset",
        "strict-mcp",
        "--out",
        ".codex-skills-registry.yaml",
      ]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      const content = await readFile(path.join(tmp, ".codex-skills-registry.yaml"), "utf8");

      expect(output).toContain("Wrote registry policy");
      expect(content).toContain("  - strict-mcp");
      expect(content).toContain("failOnWarnings: true");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("prints a named JSON Schema through the schema command argument", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "schema", "policy"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as { title: string };
    expect(parsed.title).toBe("Codex Skills Registry Policy");
  });

  it("rejects conflicting schema command selectors", async () => {
    await expect(
      runCli(["node", "codex-skills", "schema", "policy", "--schema", "mcp-server"]),
    ).rejects.toThrow("Use either the schema argument or --schema");
  });

  it("writes and applies finding baselines", async () => {
    const sourceFixtureRoot = path.join(process.cwd(), "test", "fixtures", "invalid-project");
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-baseline-"));
    const fixtureRoot = path.join(tmp, "invalid-project");
    const baselinePath = path.join(fixtureRoot, "codex-skills-baseline.json");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await cp(sourceFixtureRoot, fixtureRoot, { recursive: true });
      await runCli([
        "node",
        "codex-skills",
        "--cwd",
        fixtureRoot,
        "--no-examples",
        "baseline",
        "--strict",
        "--out",
        "codex-skills-baseline.json",
      ]);

      const baseline = JSON.parse(await readFile(baselinePath, "utf8")) as {
        issues: Array<{ code: string; fingerprint: string }>;
      };
      expect(baseline.issues.some((issue) => issue.code === "MCP_SHELL_COMMAND")).toBe(true);

      process.exitCode = undefined;
      await runCli([
        "node",
        "codex-skills",
        "--cwd",
        fixtureRoot,
        "--no-examples",
        "--baseline",
        "codex-skills-baseline.json",
        "doctor",
        "--strict",
      ]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("Baseline:");
      expect(process.exitCode).toBeUndefined();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("reports baseline inputs outside the project as diagnostics", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "--baseline",
      "../codex-skills-baseline.json",
      "doctor",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("baseline path must stay inside");
    expect(process.exitCode).toBe(1);
  });

  it("reports baseline inputs that resolve outside the project as diagnostics", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "codex-skills-baseline-symlink-"));
    const outside = await mkdtemp(path.join(tmpdir(), "codex-skills-baseline-outside-"));
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await writeFile(
        path.join(outside, "codex-skills-baseline.json"),
        JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), issues: [] }),
        "utf8",
      );
      await symlink(
        outside,
        path.join(root, "linked"),
        process.platform === "win32" ? "junction" : "dir",
      );

      await runCli([
        "node",
        "codex-skills",
        "--cwd",
        root,
        "--no-examples",
        "--baseline",
        "linked/codex-skills-baseline.json",
        "doctor",
      ]);

      const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(output).toContain("baseline path must resolve inside");
      expect(process.exitCode).toBe(1);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("prints pull request comments", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "pr-comment",
      "--max-findings",
      "2",
      "--report-path",
      "codex-skills-registry-report.md",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("## Codex Skills Registry");
    expect(output).toContain("SCHEMA_VALIDATION_FAILED");
    expect(output).toContain("Report: codex-skills-registry-report.md");
  });

  it("prints JSON pull request comment summaries with full active findings", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      "test/fixtures/invalid-project",
      "--no-examples",
      "--format",
      "json",
      "pr-comment",
      "--strict",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as {
      issues: Array<{ code?: string }>;
      report: { issues: Array<{ code?: string }> };
    };

    expect(parsed.issues.map((issue) => issue.code)).toContain("SCHEMA_VALIDATION_FAILED");
    expect(parsed.issues.map((issue) => issue.code)).toContain("MCP_SHELL_COMMAND");
    expect(parsed.issues).toHaveLength(5);
    expect(parsed.report.issues).toHaveLength(parsed.issues.length);
    expect(JSON.stringify(parsed.issues)).not.toContain(process.cwd());
    expect(process.exitCode).toBeUndefined();
  });

  it("skips pull request comment posting when GitHub context is unavailable", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("GITHUB_REPOSITORY", "");
    vi.stubEnv("REGISTRY_GITHUB_REPOSITORY", "");
    vi.stubEnv("GITHUB_PR_NUMBER", "");
    vi.stubEnv("REGISTRY_GITHUB_PR_NUMBER", "");

    await runCli([
      "node",
      "codex-skills",
      "--cwd",
      process.cwd(),
      "--format",
      "json",
      "pr-comment",
      "--post",
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as { publishResult: { posted: boolean } };
    const stderr = error.mock.calls.map((call) => call.join(" ")).join("\n");

    expect(parsed.publishResult.posted).toBe(false);
    expect(stderr).toContain("skipped pull request comment publish");
  });

  it("explains issue codes", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "explain", "MCP_UNPINNED_NPX"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("MCP_UNPINNED_NPX");
    expect(output).toContain("Remediation:");
  });
});
