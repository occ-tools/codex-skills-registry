# Changelog

## 0.2.0

- Add JSON Schema catalog and named schema export through the CLI and SDK.
- Add reusable GitHub Action support for `command: schema`.
- Document schema export for editor validation and CI integration.
- Add source file and best-effort line hints to audit, validation, SARIF, and
  GitHub Actions annotation output.
- Normalize SARIF artifact URIs and rule metadata to repository-relative paths
  when a project root is available.
- Export registry indexes with project-relative paths from the CLI.
- Reject mock runs when the requested trigger is not supported by the target
  skill.

## 0.1.1

- Include discovery diagnostics in `validate` and `audit` command failures.
- Report missing explicit policy files instead of silently using defaults.
- Tighten skill entry point and plugin skill path boundary checks.
- Harden the reusable GitHub Action by passing inputs through environment variables.
- Update roadmap status to match implemented v0.1 features.

## 0.1.0

- Add CLI and SDK for discovering Codex Skills, plugin manifests, and MCP server config.
- Add schema validation for `SKILL.md` frontmatter, MCP servers, and plugin manifests.
- Add project policy support through `.codex-skills-registry.yaml`.
- Add safe mock execution for issue, PR, release, security, dependency, and manual workflows.
- Add audit checks for risky MCP and skill patterns.
- Add JSON, SARIF, and GitHub Actions annotation output.
- Add a reusable GitHub Action and example maintainer workflow plugin.
- Add scoped npm package metadata, publish guards, and publish-ready docs.
- Add validation, release, Dependabot, CodeQL, and dependency review workflows for repository maintenance.
- Add project ownership and conduct files for a cleaner open-source contribution surface.
