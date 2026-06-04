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
      metadata: {},
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
        args: ["-y", "@upstash/context7-mcp"],
      },
    });

    expect(issues.map((issue) => issue.path)).toContain("mcp_servers.context7.args");
    expect(issues.find((issue) => issue.path === "mcp_servers.context7.args")?.code).toBe(
      "MCP_UNPINNED_NPX",
    );
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
          command: 2,
        },
        config: {
          command: "bash",
          args: ["-lc", "node server.js"],
        },
      },
      { strict: true },
    );

    const commandIssue = issues.find((issue) => issue.path === "mcp_servers.shell.command");
    expect(commandIssue?.severity).toBe("error");
    expect(commandIssue?.line).toBe(2);
  });

  it("does not throw when a caller bypasses schema validation with an invalid URL", () => {
    const issues = auditMcpServer({
      name: "remote",
      sourcePath: "config.toml",
      config: {
        url: "not a url",
      } as never,
    });

    expect(issues.some((issue) => issue.code === "MCP_INVALID_REMOTE_URL")).toBe(true);
  });

  it("flags secret-like literals in MCP headers and bearer token fields", () => {
    const issues = auditMcpServer({
      name: "remote",
      sourcePath: "config.toml",
      config: {
        url: "https://example.com/mcp",
        enabled_tools: ["search"],
        http_headers: {
          Authorization: "Bearer abc1234567890SECRET",
        },
        bearer_token_env_var: "tok_1234567890abcdef",
      } as never,
    });

    expect(issues.filter((issue) => issue.code === "MCP_SECRET_LITERAL")).toHaveLength(2);
  });

  it("flags remote MCP URL query secrets and invalid auth variable names", () => {
    const issues = auditMcpServer({
      name: "remote",
      sourcePath: "config.toml",
      config: {
        url: "https://example.com/mcp?token=abc1234567890SECRET",
        enabled_tools: ["search"],
        bearer_token_env_var: "token-name",
        env_http_headers: {
          Authorization: "bad-name",
        },
      } as never,
    });

    expect(issues.map((issue) => issue.code)).toContain("MCP_REMOTE_URL_SECRET");
    expect(issues.map((issue) => issue.code)).toContain("MCP_REMOTE_TOKEN_ENV_VAR_INVALID");
    expect(issues.map((issue) => issue.code)).toContain("MCP_HEADER_ENV_VAR_INVALID");
  });

  it("applies MCP deny-list policy checks", () => {
    const issues = auditMcpServer(
      {
        name: "blocked",
        sourcePath: "config.toml",
        config: {
          command: "bash",
          enabled_tools: ["run"],
        },
      },
      {
        policy: {
          deniedMcpServers: ["blocked"],
          deniedMcpCommands: ["bash"],
          requirePinnedMcpPackages: false,
          requirePinnedWorkflowActions: false,
          requireExplicitMcpToolPolicy: false,
          requirePluginSkillPaths: false,
          failOnWarnings: false,
          suppressions: [],
        },
      },
    );

    expect(issues.map((issue) => issue.code)).toContain("MCP_SERVER_DENIED");
    expect(issues.map((issue) => issue.code)).toContain("MCP_COMMAND_DENIED");
  });
});
