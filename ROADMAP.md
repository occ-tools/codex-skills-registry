# Roadmap

## v0.1

- CLI and SDK for Codex Skill discovery
- `SKILL.md` frontmatter validation
- MCP server config parsing
- plugin manifest indexing
- safe mock executor
- audit warnings for common maintainer review risks
- reusable GitHub Action
- project-level policy file
- JSON, SARIF, and GitHub Actions annotation output

## v0.2

- JSON Schema export
- SARIF locations with repository-relative paths and best-effort line hints
- reusable GitHub Action support for schema export
- policy presets and starter policy generation
- registry report command
- PR-focused changed-file filtering
- clean and risky demo projects

## v0.3

- first-party fixtures for common OSS workflow templates
- plugin bundle compatibility checks against real-world example layouts
- registry index publishing workflow
- docs site generated from exported registry index
- richer MCP policy checks and deny-list rules

## v0.4+

- optional trusted execution mode with sandboxing research

## Non-goals

- replacing Codex itself
- acting as an official OpenAI registry
- executing arbitrary user code by default
