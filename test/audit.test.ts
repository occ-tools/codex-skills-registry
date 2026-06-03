import { describe, expect, it } from "vitest";
import { auditMcpServer, auditSkill } from "../src/audit.js";
import type { CodexSkill } from "../src/schema.js";

describe("audit", () => {
  it("flags skill entry points that escape the skill directory", () => {
    const skill: CodexSkill = {
      name: "bad-entry",
      description: "A deliberately invalid skill used to test registry safety checks.",
      version: "0.1.0",
      triggers: ["manual"],
      entryPoint: "../outside.js",
      source: "inline",
      tags: [],
      metadata: {}
    };

    const issues = auditSkill(skill);

    expect(issues.some((issue) => issue.severity === "error")).toBe(true);
    expect(issues.map((issue) => issue.path)).toContain("bad-entry.entryPoint");
  });

  it("warns about broad MCP tool exposure and unpinned npx packages", () => {
    const issues = auditMcpServer({
      name: "context7",
      sourcePath: "config.toml",
      config: {
        command: "npx",
        args: ["-y", "@upstash/context7-mcp"]
      }
    });

    expect(issues.map((issue) => issue.path)).toContain("mcp_servers.context7.args");
    expect(issues.map((issue) => issue.path)).toContain("mcp_servers.context7.enabled_tools");
    expect(issues.every((issue) => issue.file === "config.toml")).toBe(true);
  });

  it("promotes shell command risk to an error in strict mode", () => {
    const issues = auditMcpServer(
      {
      name: "shell",
      sourcePath: "config.toml",
      line: 1,
      fieldLines: {
        command: 2
      },
      config: {
        command: "bash",
        args: ["-lc", "node server.js"]
        }
      },
      { strict: true }
    );

    const commandIssue = issues.find((issue) => issue.path === "mcp_servers.shell.command");
    expect(commandIssue?.severity).toBe("error");
    expect(commandIssue?.line).toBe(2);
  });
});
