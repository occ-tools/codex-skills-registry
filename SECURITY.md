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
- audit risky patterns such as shell-based MCP commands, broad tool exposure, and entry points that escape a skill directory
- mock-run skills without invoking arbitrary code

Out of scope for v0.1:

- executing arbitrary skill scripts
- guaranteeing that a third-party MCP server is safe
- scanning full source code for malicious behavior
- sandboxing tools or network calls

If real execution is added later, it should require explicit opt-in, policy
configuration, and sandboxing.
