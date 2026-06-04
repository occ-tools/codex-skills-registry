export interface RegistryRuleExplanation {
  code: string;
  title: string;
  description: string;
  remediation: string;
}

const RULES: RegistryRuleExplanation[] = [
  {
    code: "MCP_SHELL_COMMAND",
    title: "Shell-based MCP command",
    description:
      "An MCP server is launched through a shell command, which can expand arguments and execute arbitrary shell code.",
    remediation: "Use a direct executable command and restrict enabled_tools or disabled_tools.",
  },
  {
    code: "MCP_UNPINNED_NPX",
    title: "Unpinned npx package",
    description:
      "An npx-based MCP server does not pin a full package version, so CI can run different code over time.",
    remediation: "Pin the package argument with a full version such as @scope/server@1.2.3.",
  },
  {
    code: "MCP_TOOL_POLICY_MISSING",
    title: "Missing MCP tool exposure policy",
    description:
      "The MCP server does not declare enabled_tools or disabled_tools, making the exposed tool surface unclear.",
    remediation:
      "Declare enabled_tools for least privilege, or disabled_tools for explicit exclusions.",
  },
  {
    code: "MCP_REMOTE_NOT_HTTPS",
    title: "Remote MCP server without HTTPS",
    description: "Remote MCP traffic over non-HTTPS transports can expose requests or credentials.",
    remediation:
      "Use an HTTPS endpoint or add a documented suppression for an intentional local-only exception.",
  },
  {
    code: "MCP_SECRET_LITERAL",
    title: "Potential secret literal",
    description: "A value in MCP env or headers looks like a committed token or credential.",
    remediation: "Move the secret to an environment variable and commit only the variable name.",
  },
  {
    code: "MCP_REMOTE_URL_SECRET",
    title: "Credential-like MCP URL query",
    description: "A remote MCP URL appears to include a token, key, secret, or credential value.",
    remediation: "Move remote MCP credentials to bearer_token_env_var or env_http_headers.",
  },
  {
    code: "MCP_REMOTE_TOKEN_ENV_VAR_INVALID",
    title: "Invalid MCP token environment variable name",
    description:
      "bearer_token_env_var should name an environment variable, not use shell-specific or literal value syntax.",
    remediation: "Use a portable variable name such as MCP_TOKEN.",
  },
  {
    code: "MCP_HEADER_ENV_VAR_INVALID",
    title: "Invalid MCP header environment variable name",
    description:
      "env_http_headers values should be environment variable names that resolve at runtime.",
    remediation: "Use uppercase variable names such as MCP_AUTH_HEADER.",
  },
  {
    code: "WORKFLOW_PERMISSIONS_MISSING",
    title: "Missing explicit workflow permissions",
    description: "A GitHub Actions workflow does not explicitly declare GITHUB_TOKEN permissions.",
    remediation: "Add least-privilege top-level or job-level permissions.",
  },
  {
    code: "WORKFLOW_BROAD_PERMISSIONS",
    title: "Broad workflow token permissions",
    description: "A workflow grants write-all or high-risk write permissions to GITHUB_TOKEN.",
    remediation: "Scope write permissions to the smallest job and permission set required.",
  },
  {
    code: "WORKFLOW_PULL_REQUEST_TARGET",
    title: "pull_request_target workflow",
    description:
      "pull_request_target runs with elevated repository context and can expose write tokens to unsafe logic.",
    remediation:
      "Prefer pull_request or isolate untrusted checkout, input interpolation, and write operations.",
  },
  {
    code: "WORKFLOW_UNPINNED_ACTION",
    title: "Unpinned workflow action",
    description:
      "A workflow action reference uses a mutable tag or branch instead of a full commit SHA.",
    remediation: "Pin action references to audited 40-character commit SHAs.",
  },
  {
    code: "WORKFLOW_UNTRUSTED_PR_INPUT",
    title: "Untrusted PR input in shell script",
    description: "A pull request workflow interpolates PR event data directly into a run step.",
    remediation:
      "Pass PR values through environment variables and quote shell references carefully.",
  },
  {
    code: "WORKFLOW_DOWNLOAD_EXECUTE",
    title: "Downloaded script execution",
    description: "A workflow pipes downloaded content into a shell.",
    remediation: "Vendor the script, verify checksums, or use a pinned action.",
  },
  {
    code: "SKILL_ENTRY_POINT_ESCAPE",
    title: "Skill entry point escapes its directory",
    description: "The configured entryPoint resolves outside the skill directory.",
    remediation: "Use a relative path inside the skill folder and avoid .. path segments.",
  },
  {
    code: "PLUGIN_SKILL_PATH_ESCAPE",
    title: "Plugin skill path escapes plugin root",
    description: "A plugin manifest references a skill path outside its own plugin directory.",
    remediation: "Reference a plugin-local directory containing SKILL.md.",
  },
  {
    code: "BASELINE_LOAD_FAILED",
    title: "Baseline file could not be loaded",
    description:
      "The configured baseline file is missing, invalid JSON, or does not match the baseline schema.",
    remediation: "Regenerate the baseline with codex-skills baseline or fix baselineFile.",
  },
];

const RULE_MAP = new Map(RULES.map((rule) => [rule.code, rule]));

export function listRegistryRules(): RegistryRuleExplanation[] {
  return [...RULES];
}

export function explainRegistryRule(code: string): RegistryRuleExplanation | undefined {
  return RULE_MAP.get(code.toUpperCase());
}
