# codex-skills-registry

[![Validate](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/validate.yml/badge.svg)](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/validate.yml)
[![CodeQL](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/codeql.yml/badge.svg)](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/codeql.yml)
[![npm](https://img.shields.io/npm/v/%40wangjiehu%2Fcodex-skills-registry.svg)](https://www.npmjs.com/package/@wangjiehu/codex-skills-registry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`codex-skills-registry` is a small TypeScript CLI and SDK for open-source
maintainers who want to validate, index, and safely test Codex Skills, plugin
manifests, and MCP server configuration before they become part of a repository.

This is an unofficial community project and is not affiliated with or endorsed
by OpenAI.

The project focuses on maintainer workflows: issue triage, pull request review,
release notes, dependency review, and security-oriented automation.

## Status

This is an early v0.1 project. It validates, indexes, audits, and mock-runs
workflow definitions. It does not execute arbitrary skill scripts.

## Why this exists

Codex Skills are directory-based workflows built around a required `SKILL.md`
file. MCP servers add external tools and context through Codex configuration.
Both are powerful, but open-source projects need repeatable checks before they
accept community-contributed automation.

This registry gives maintainers a CI-friendly surface:

- discover `.agents/skills`
- parse and validate `SKILL.md` frontmatter
- inspect `.codex/config.toml` MCP server definitions
- index plugin manifests
- mock-run a skill against issue, PR, or release events without executing
  arbitrary code
- audit MCP and skill definitions for review-worthy safety risks
- enforce project-specific policy through `.codex-skills-registry.yaml`
- emit JSON, SARIF, and GitHub Actions annotations for CI
- export a JSON index for docs, CI artifacts, or future registry services

## Quick start

Requires Node.js 20 or newer.

Run the CLI from npm:

```bash
npx @wangjiehu/codex-skills-registry@latest doctor
npx @wangjiehu/codex-skills-registry@latest list
```

Or install the `codex-skills` binary globally:

```bash
npm install -g @wangjiehu/codex-skills-registry
codex-skills doctor
```

From a local checkout:

```bash
npm install
npm run build
node dist/cli.js list
node dist/cli.js validate issue-triage
node dist/cli.js run issue-triage --trigger issue
node dist/cli.js doctor
```

During development:

```bash
npm run dev -- list
npm run dev -- export --out registry-index.json
```

## CLI

```bash
codex-skills list
codex-skills validate [name]
codex-skills run <name> --trigger issue
codex-skills doctor
codex-skills audit
codex-skills export --out registry-index.json
```

For machine-readable CI output:

```bash
codex-skills doctor --format json
codex-skills audit --format json
codex-skills doctor --format sarif
codex-skills doctor --github-annotations
```

Legacy prototype flags are also supported:

```bash
codex-skills --list
codex-skills --validate --name issue-triage
codex-skills --run issue-triage
```

## Project layout

```text
src/schema.ts      Zod schemas for skills, MCP servers, and plugin manifests
src/discovery.ts   Filesystem discovery for .agents/skills and .codex/config.toml
src/registry.ts    In-memory registry, validation, and JSON export
src/policy.ts      Project policy loading for .codex-skills-registry.yaml
src/audit.ts       Safety checks for review-worthy MCP and skill risks
src/sarif.ts       SARIF conversion for Code Scanning integrations
src/executor.ts    Safe mock executor
src/cli.ts         Commander-based CLI
examples/          Example maintainer workflows and MCP config
test/              Vitest coverage for schemas, discovery, and registry behavior
```

## Codex compatibility

The registry validates the official Codex plugin shape:

- plugin manifests live at `.codex-plugin/plugin.json`
- `skills` points to a bundled skills directory such as `./skills/`
- `mcpServers` points to a bundled `.mcp.json` file
- manifest component paths are relative to the plugin root and start with `./`

For migration and registry use cases, it also accepts extension fields such as
inline `mcp_servers` and array-based `skills` references. Those are registry
extensions, not the recommended Codex plugin distribution format.

## Skill format

A skill is a directory with a `SKILL.md` file. This project validates the
official minimum fields and accepts optional registry metadata:

```markdown
---
name: issue-triage
description: Triage GitHub issues by classifying intent and drafting a response.
version: 0.1.0
triggers:
  - issue
entryPoint: scripts/run.ts
---

# Issue Triage
```

Skills disabled through Codex config are skipped and reported as diagnostics:

```toml
[[skills.config]]
name = "issue-triage"
enabled = false
```

## Safety model

The mock executor does not run skill scripts. It only verifies that a registered
skill can be routed to a simulated maintainer event and prints the handler that
would be used. Real execution should be added later behind explicit trust,
sandboxing, and repository policy checks.

The audit command highlights patterns that deserve maintainer review:

- skill entry points that escape their skill directory
- shell-based MCP server commands
- unpinned `npx` MCP packages
- MCP servers without explicit tool allow or deny lists
- broad tool approval policies
- potential secret literals in MCP environment values

## What it does not do

- execute community-contributed skill scripts
- prove that a third-party MCP server is safe
- replace Codex, the Codex app, or the Codex plugin directory
- publish or install plugins
- scan arbitrary source code for malicious behavior

## Project policy

Maintainers can add `.codex-skills-registry.yaml` to make CI stricter:

```yaml
requirePinnedMcpPackages: true
allowedMcpCommands:
  - node
  - python
  - uvx
allowedRemoteMcpHosts:
  - example.com
requireExplicitMcpToolPolicy: true
requirePluginSkillPaths: true
failOnWarnings: false
```

Policy is intentionally small for v0.1. It should catch review-worthy risks
without pretending to prove that a third-party MCP server is safe.

## GitHub Action

Use the bundled composite action to validate a repository in CI:

```yaml
name: codex-skills

on:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: wangjiehu/codex-skills-registry@v0.1.0
        with:
          path: .
          command: doctor
          policy: .codex-skills-registry.yaml
          format: text
          strict: "false"
```

Supported action commands are `doctor`, `validate`, `list`, `audit`, and
`export`. The action emits GitHub annotations for diagnostics, validation
issues, and audit findings.

To upload SARIF to GitHub Code Scanning, run:

```yaml
- id: codex-skills
  uses: wangjiehu/codex-skills-registry@v0.1.0
  continue-on-error: true
  with:
    path: .
    command: doctor
    format: sarif
- uses: github/codeql-action/upload-sarif@v4
  if: always() && steps.codex-skills.outputs.sarif-path != ''
  with:
    sarif_file: ${{ steps.codex-skills.outputs.sarif-path }}
- if: steps.codex-skills.outcome == 'failure'
  run: exit 1
```

The `export` command writes JSON registry indexes. SARIF is currently printed
to stdout by `doctor`, `audit`, and `validate` when using the CLI directly; the
GitHub Action captures SARIF to `codex-skills-registry.sarif`.

## SDK

```ts
import { SkillsRegistry, executeMockSkill } from "@wangjiehu/codex-skills-registry";

const registry = await SkillsRegistry.load({ cwd: process.cwd() });
console.log(registry.formatSkillsTable());

const validation = await registry.validateSkillByName("issue-triage");
const result = await executeMockSkill(registry, "issue-triage", {
  trigger: "issue"
});
```

## Development

```bash
npm run validate
npm run pack:check
```

The GitHub Actions workflow runs install, build, test, CLI smoke tests, and a
smoke test of the reusable action.

## Release

The package is configured as the public scoped package
`@wangjiehu/codex-skills-registry`. Before the first npm release, confirm the
publishing account owns the `@wangjiehu` npm scope.

Local release check:

```bash
npm run release:check
```

Manual npm publish:

```bash
npm login
npm publish --access public
```

`npm publish` also runs `npm run release:check` through `prepublishOnly`, so a
local publish cannot skip build, tests, and dry-run packaging by accident.

Automated releases run when a semver tag such as `v0.1.0` is pushed. Configure
the repository secret `NPM_TOKEN`; the release workflow publishes with npm
provenance enabled.
