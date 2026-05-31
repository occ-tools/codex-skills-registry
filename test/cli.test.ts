import { afterEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.js";

describe("CLI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
      "--strict"
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as { version: string; runs: Array<{ results: unknown[] }> };
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs[0]?.results.length).toBeGreaterThan(0);
    expect(process.exitCode).toBe(1);
  });

  it("honors JSON output for the list subcommand", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runCli(["node", "codex-skills", "--cwd", process.cwd(), "--format", "json", "list"]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    const parsed = JSON.parse(output) as { skills: Array<{ name: string }> };
    expect(parsed.skills.map((skill) => skill.name)).toContain("issue-triage");
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
      "--strict"
    ]);

    const output = log.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("Shell-based MCP commands require careful review");
    expect(process.exitCode).toBe(1);
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
      "--strict"
    ]);

    const output = error.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("::error");
    expect(output).toContain("Shell-based MCP commands require careful review");
    expect(process.exitCode).toBe(1);
  });
});
