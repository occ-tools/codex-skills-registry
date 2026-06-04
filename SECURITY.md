# Security Policy

This project validates and indexes maintainer automation definitions. It does
not execute community-contributed skill scripts.

## Supported versions

Security fixes target the latest released minor version.

## Reporting a vulnerability

Please open a private security advisory on GitHub or contact the maintainers
privately if GitHub advisories are not available.

Include:

- affected version or commit
- steps to reproduce
- impact
- whether the issue requires a malicious skill, MCP config, plugin manifest, or CLI input

## Security model

Current behavior:

- parse `SKILL.md` frontmatter
- validate MCP server config shape
- audit risky patterns such as shell-based MCP commands, broad tool exposure,
  insecure remote MCP hosts, likely secret literals, and entry points that
  escape a skill directory
- mock-run skills without invoking arbitrary code
- emit review findings through text, JSON, SARIF, and GitHub Actions annotations

Primary threats this project is designed to surface:

- skill entry points that traverse outside the skill directory
- plugin manifests that reference files outside the plugin root
- MCP servers that execute shell wrappers or unpinned packages
- MCP servers that expose broad tool access without an explicit allow or deny list
- remote MCP servers that use insecure transport or unapproved hosts
- secrets embedded directly in MCP environment, HTTP header, or bearer token
  configuration

Current controls:

- Skill execution is mocked only; entry point scripts are not invoked.
- Plugin skill and MCP paths are checked against their containing root.
- Project policy can require pinned MCP packages, approved MCP commands,
  approved remote hosts, explicit MCP tool policy, and plugin skill paths.
- Project policy can deny specific skills, plugins, MCP servers, commands, and
  remote MCP hosts.
- Baseline files and expiring suppressions support incremental adoption without
  hiding newly introduced findings.
- Findings include source file and best-effort line hints for CI review.
- Examples should use harmless local templates and must not include real
  credentials, tokens, private URLs, or production data.

Out of scope for the current release:

- executing arbitrary skill scripts
- guaranteeing that a third-party MCP server is safe
- scanning full source code for malicious behavior
- sandboxing tools or network calls

If real execution is added later, it should require explicit opt-in, policy
configuration, and sandboxing.
