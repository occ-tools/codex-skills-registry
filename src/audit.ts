import path from "node:path";
import type { DiscoveredMcpServer } from "./discovery.js";
import type { RegistryPolicy } from "./policy.js";
import type { CodexSkill, ValidationIssue } from "./schema.js";

export interface AuditInput {
  skills: CodexSkill[];
  mcpServers: DiscoveredMcpServer[];
}

export interface AuditOptions {
  strict?: boolean;
  policy?: RegistryPolicy;
}

const SHELL_COMMANDS = new Set([
  "bash",
  "cmd",
  "cmd.exe",
  "fish",
  "pwsh",
  "pwsh.exe",
  "powershell",
  "powershell.exe",
  "sh",
  "zsh"
]);

/**
 * Runs registry-level safety checks that complement schema validation. These
 * checks are intentionally conservative and focus on review visibility rather
 * than blocking every possible risk by default.
 *
 * @param input - Registry assets to audit.
 * @param options - Audit strictness options.
 * @returns Audit issues.
 */
export function auditRegistry(input: AuditInput, options: AuditOptions = {}): ValidationIssue[] {
  return [
    ...input.skills.flatMap((skill) => auditSkill(skill, options)),
    ...input.mcpServers.flatMap((server) => auditMcpServer(server, options))
  ];
}

/**
 * Audits a single Codex Skill entry for path and metadata risks.
 *
 * @param skill - Skill to audit.
 * @param options - Audit strictness options.
 * @returns Audit issues.
 */
export function auditSkill(skill: CodexSkill, options: AuditOptions = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (skill.entryPoint) {
    if (path.isAbsolute(skill.entryPoint)) {
      issues.push({
        severity: "error",
        path: `${skill.name}.entryPoint`,
        message: "Skill entryPoint must be relative to the skill directory."
      });
    }

    const normalized = path.normalize(skill.entryPoint);
    if (normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) {
      issues.push({
        severity: "error",
        path: `${skill.name}.entryPoint`,
        message: "Skill entryPoint must not escape the skill directory."
      });
    }
  } else if (options.strict) {
    issues.push({
      severity: "warning",
      path: `${skill.name}.entryPoint`,
      message: "Instruction-only skill has no entryPoint; document this intentionally."
    });
  }

  if (skill.triggers.includes("security") && !skill.tags.includes("security")) {
    issues.push({
      severity: "warning",
      path: `${skill.name}.tags`,
      message: "Security-triggered skills should carry a security tag for review routing."
    });
  }

  return issues;
}

/**
 * Audits a discovered MCP server for approval policy, auth, and command risk.
 *
 * @param server - MCP server entry.
 * @param options - Audit strictness options.
 * @returns Audit issues.
 */
export function auditMcpServer(
  server: DiscoveredMcpServer,
  options: AuditOptions = {}
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const config = server.config as Record<string, unknown>;
  const basePath = `mcp_servers.${server.name}`;
  const policy = options.policy;

  if (typeof config.command === "string") {
    const commandName = path.basename(config.command).toLowerCase();
    const args = Array.isArray(config.args) ? config.args.map(String) : [];

    if (policy?.allowedMcpCommands && !policy.allowedMcpCommands.includes(commandName)) {
      issues.push({
        severity: "error",
        path: `${basePath}.command`,
        message: `MCP command '${commandName}' is not allowed by project policy.`
      });
    }

    if (SHELL_COMMANDS.has(commandName)) {
      issues.push({
        severity: options.strict ? "error" : "warning",
        path: `${basePath}.command`,
        message:
          "Shell-based MCP commands require careful review because arguments may execute arbitrary code."
      });
    }

    if (
      (policy?.requirePinnedMcpPackages || commandName === "npx") &&
      commandName === "npx" &&
      !args.some((arg) => /@[0-9]+\.[0-9]+\.[0-9]+/.test(arg))
    ) {
      issues.push({
        severity: policy?.requirePinnedMcpPackages ? "error" : "warning",
        path: `${basePath}.args`,
        message: "npx MCP servers should pin package versions for reproducible CI."
      });
    }
  }

  if (typeof config.url === "string") {
    const url = new URL(config.url);
    if (policy?.allowedRemoteMcpHosts && !policy.allowedRemoteMcpHosts.includes(url.host)) {
      issues.push({
        severity: "error",
        path: `${basePath}.url`,
        message: `Remote MCP host '${url.host}' is not allowed by project policy.`
      });
    }

    if (url.protocol !== "https:") {
      issues.push({
        severity: options.strict ? "error" : "warning",
        path: `${basePath}.url`,
        message: "Remote MCP servers should use HTTPS."
      });
    }

    if (!config.bearer_token_env_var && options.strict) {
      issues.push({
        severity: "warning",
        path: `${basePath}.bearer_token_env_var`,
        message: "Remote MCP servers without bearer_token_env_var should be explicitly documented."
      });
    }
  }

  if (!config.enabled_tools && !config.disabled_tools) {
    issues.push({
      severity: policy?.requireExplicitMcpToolPolicy ? "error" : "warning",
      path: `${basePath}.enabled_tools`,
      message: "MCP server does not declare enabled_tools or disabled_tools; review tool exposure."
    });
  }

  if (config.default_tools_approval_mode === "always" || config.default_tools_approval_mode === "never") {
    issues.push({
      severity: options.strict ? "error" : "warning",
      path: `${basePath}.default_tools_approval_mode`,
      message: "Broad default tool approval policies should be reviewed by a maintainer."
    });
  }

  if (config.env && typeof config.env === "object" && !Array.isArray(config.env)) {
    for (const [key, value] of Object.entries(config.env as Record<string, unknown>)) {
      if (/(token|secret|key|password)/i.test(key) && typeof value === "string" && value.length > 8) {
        issues.push({
          severity: "warning",
          path: `${basePath}.env.${key}`,
          message: "Potential secret literal found in MCP env; prefer env_vars or bearer_token_env_var."
        });
      }
    }
  }

  return issues;
}
