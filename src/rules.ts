export interface RegistryRuleExplanation {
  code: string;
  title: string;
  description: string;
  remediation: string;
}

const RULES: RegistryRuleExplanation[] = [
  {
    code: "SCHEMA_VALIDATION_FAILED",
    title: "Schema validation failed",
    description: "A registry document does not match the published Codex Skills schema.",
    remediation: "Fix the reported field, then rerun codex-skills validate or doctor.",
  },
  {
    code: "CONFIG_SKILLS_MISSING",
    title: "Configured skills list is missing",
    description: "A skill config file was provided but did not include a skills array.",
    remediation: "Add a skills array or remove the invalid config file.",
  },
  {
    code: "CONFIG_SKILL_INVALID",
    title: "Configured skill is invalid",
    description: "A skill entry loaded from config could not be validated as a Codex Skill.",
    remediation: "Fix the configured skill metadata or remove the invalid entry.",
  },
  {
    code: "SKILL_FILE_MISSING",
    title: "Missing SKILL.md file",
    description: "A discovered skill directory does not contain a readable SKILL.md file.",
    remediation: "Add SKILL.md or remove the directory from the registry scan path.",
  },
  {
    code: "SKILL_MARKDOWN_INVALID",
    title: "Invalid skill Markdown",
    description: "A SKILL.md file could not be parsed into valid frontmatter and content.",
    remediation: "Fix the frontmatter syntax and required skill metadata fields.",
  },
  {
    code: "SKILL_DISABLED",
    title: "Disabled skill skipped",
    description: "A skill was marked disabled and skipped by discovery.",
    remediation: "Enable the skill only after it is ready for validation and use.",
  },
  {
    code: "SKILL_DUPLICATE",
    title: "Duplicate skill name",
    description: "Two discovered skills use the same registry name.",
    remediation: "Rename one skill or remove the duplicate registration.",
  },
  {
    code: "SKILL_NOT_REGISTERED",
    title: "Skill is not registered",
    description: "A requested skill name does not exist in the loaded registry.",
    remediation: "Use a registered skill name or add the missing skill to the project.",
  },
  {
    code: "SKILL_NOT_ALLOWED",
    title: "Skill not allowed by policy",
    description:
      "The project policy allows only specific skills and this skill is outside that list.",
    remediation: "Add the skill to allowedSkills or remove it from the registry.",
  },
  {
    code: "SKILL_DENIED",
    title: "Skill denied by policy",
    description: "The project policy explicitly denies this skill.",
    remediation: "Remove the skill or update deniedSkills after maintainer review.",
  },
  {
    code: "SKILL_ABSOLUTE_ENTRY_POINT",
    title: "Absolute skill entry point",
    description: "A skill entryPoint uses an absolute path instead of a skill-local path.",
    remediation: "Use a relative entryPoint such as scripts/run.js.",
  },
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
    code: "MCP_CONFIG_PARSE_FAILED",
    title: "MCP config parse failed",
    description: "A Codex MCP config file could not be parsed.",
    remediation: "Fix the TOML/JSON syntax or remove the invalid MCP config file.",
  },
  {
    code: "MCP_SERVER_NOT_ALLOWED",
    title: "MCP server not allowed by policy",
    description:
      "The project policy allows only specific MCP servers and this server is outside that list.",
    remediation: "Add the server to allowedMcpServers or remove the server config.",
  },
  {
    code: "MCP_SERVER_DENIED",
    title: "MCP server denied by policy",
    description: "The project policy explicitly denies this MCP server.",
    remediation: "Remove the server or update deniedMcpServers after maintainer review.",
  },
  {
    code: "MCP_COMMAND_NOT_ALLOWED",
    title: "MCP command not allowed by policy",
    description: "The MCP server command is outside the policy allow-list.",
    remediation: "Use an allowed command wrapper or update allowedMcpCommands after review.",
  },
  {
    code: "MCP_COMMAND_DENIED",
    title: "MCP command denied by policy",
    description: "The MCP server command is explicitly denied by project policy.",
    remediation: "Replace the command or update deniedMcpCommands after maintainer review.",
  },
  {
    code: "MCP_BROAD_APPROVAL_MODE",
    title: "Broad MCP approval mode",
    description: "The MCP server uses an always or never default tool approval mode.",
    remediation: "Prefer prompt-based or per-tool approval unless the broad mode is intentional.",
  },
  {
    code: "MCP_INVALID_REMOTE_URL",
    title: "Invalid remote MCP URL",
    description: "A remote MCP server URL is not a valid absolute URL.",
    remediation: "Use a valid URL such as https://example.com/mcp.",
  },
  {
    code: "MCP_REMOTE_NOT_HTTPS",
    title: "Remote MCP server without HTTPS",
    description: "Remote MCP traffic over non-HTTPS transports can expose requests or credentials.",
    remediation:
      "Use an HTTPS endpoint or add a documented suppression for an intentional local-only exception.",
  },
  {
    code: "MCP_REMOTE_HOST_NOT_ALLOWED",
    title: "Remote MCP host not allowed by policy",
    description: "The remote MCP endpoint host is outside the policy allow-list.",
    remediation: "Use an approved host or add the host to allowedRemoteMcpHosts after review.",
  },
  {
    code: "MCP_REMOTE_HOST_DENIED",
    title: "Remote MCP host denied by policy",
    description: "The remote MCP endpoint host is explicitly denied by project policy.",
    remediation: "Use a different endpoint or update deniedRemoteMcpHosts after review.",
  },
  {
    code: "MCP_REMOTE_AUTH_UNDOCUMENTED",
    title: "Remote MCP auth is undocumented",
    description: "Strict mode found a remote MCP server without bearer_token_env_var.",
    remediation: "Set bearer_token_env_var or document why the endpoint does not require auth.",
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
    code: "SKILL_ENTRY_POINT_MISSING",
    title: "Skill entry point file is missing",
    description: "A skill entryPoint references a file that was not found.",
    remediation: "Create the entryPoint file or update the skill metadata to the correct path.",
  },
  {
    code: "SKILL_INSTRUCTION_ONLY",
    title: "Instruction-only skill",
    description: "Strict mode found a skill without an executable entryPoint.",
    remediation: "Add an entryPoint or suppress the warning with a documented reason.",
  },
  {
    code: "SKILL_SECURITY_TAG_MISSING",
    title: "Security skill tag missing",
    description: "A skill triggered by security does not include a security tag.",
    remediation: "Add the security tag so review and routing workflows can identify it.",
  },
  {
    code: "PLUGIN_MANIFEST_PARSE_FAILED",
    title: "Plugin manifest parse failed",
    description: "A plugin manifest could not be parsed as valid JSON.",
    remediation: "Fix .codex-plugin/plugin.json syntax and required fields.",
  },
  {
    code: "PLUGIN_NOT_ALLOWED",
    title: "Plugin not allowed by policy",
    description:
      "The project policy allows only specific plugins and this plugin is outside that list.",
    remediation: "Add the plugin to allowedPlugins or remove the plugin manifest.",
  },
  {
    code: "PLUGIN_DENIED",
    title: "Plugin denied by policy",
    description: "The project policy explicitly denies this plugin.",
    remediation: "Remove the plugin or update deniedPlugins after maintainer review.",
  },
  {
    code: "PLUGIN_SKILL_PATH_REQUIRED",
    title: "Plugin skill path required",
    description: "Policy requires plugin manifests to declare bundled skill paths.",
    remediation: "Add skills paths to the plugin manifest or relax requirePluginSkillPaths.",
  },
  {
    code: "PLUGIN_SKILL_PATH_INVALID",
    title: "Plugin skill path is invalid",
    description: "A plugin manifest skill path is malformed or cannot be resolved.",
    remediation: "Use a valid plugin-local path to a skill directory.",
  },
  {
    code: "PLUGIN_SKILL_PATH_ESCAPE",
    title: "Plugin skill path escapes plugin root",
    description: "A plugin manifest references a skill path outside its own plugin directory.",
    remediation: "Reference a plugin-local directory containing SKILL.md.",
  },
  {
    code: "PLUGIN_SKILL_NAME_MISMATCH",
    title: "Plugin skill name mismatch",
    description: "A bundled skill name does not match the name declared by the plugin manifest.",
    remediation: "Align the plugin manifest and SKILL.md metadata.",
  },
  {
    code: "PLUGIN_SKILLS_PATH_INVALID",
    title: "Plugin skills path is invalid",
    description: "A plugin manifest skills path is malformed or cannot be resolved.",
    remediation: "Use valid plugin-local paths for bundled skills.",
  },
  {
    code: "PLUGIN_SKILLS_PATH_ESCAPE",
    title: "Plugin skills path escapes plugin root",
    description: "A plugin manifest skills path resolves outside the plugin directory.",
    remediation: "Keep skills paths inside the plugin root.",
  },
  {
    code: "PLUGIN_MCP_PARSE_FAILED",
    title: "Plugin MCP config parse failed",
    description: "A plugin-referenced MCP config could not be parsed.",
    remediation: "Fix the MCP config syntax or remove the invalid reference.",
  },
  {
    code: "PLUGIN_MCP_PATH_MISSING",
    title: "Plugin MCP path is missing",
    description: "A plugin manifest references an MCP config file that does not exist.",
    remediation: "Create the referenced MCP config or update the plugin manifest path.",
  },
  {
    code: "PLUGIN_MCP_PATH_ESCAPE",
    title: "Plugin MCP path escapes plugin root",
    description: "A plugin manifest MCP config path resolves outside the plugin directory.",
    remediation: "Keep MCP config paths inside the plugin root.",
  },
  {
    code: "PLUGIN_MCP_NOT_DISCOVERED",
    title: "Plugin MCP server not discovered",
    description: "A plugin manifest references an MCP server that was not found during discovery.",
    remediation: "Fix the MCP server name, config path, or plugin manifest reference.",
  },
  {
    code: "WORKFLOW_INVALID",
    title: "Workflow is invalid",
    description: "A GitHub Actions workflow did not match the expected workflow structure.",
    remediation: "Fix the workflow YAML fields and rerun codex-skills doctor.",
  },
  {
    code: "WORKFLOW_PARSE_FAILED",
    title: "Workflow parse failed",
    description: "A GitHub Actions workflow could not be parsed as YAML.",
    remediation: "Fix the workflow YAML syntax.",
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
