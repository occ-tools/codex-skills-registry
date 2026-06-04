# codex-skills-registry

[![Validate](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/validate.yml/badge.svg)](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/validate.yml)
[![CodeQL](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/codeql.yml/badge.svg)](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/scorecard.yml/badge.svg)](https://github.com/wangjiehu/codex-skills-registry/actions/workflows/scorecard.yml)
[![npm](https://img.shields.io/npm/v/%40wangjiehu%2Fcodex-skills-registry.svg)](https://www.npmjs.com/package/@wangjiehu/codex-skills-registry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`codex-skills-registry` is a small TypeScript CLI and SDK for open-source
maintainers who want to validate, index, and safely test Codex Skills, plugin
manifests, MCP server configuration, and GitHub Actions workflows before they
become trusted repository automation.

This is an unofficial community project and is not affiliated with or endorsed
by OpenAI.

The project focuses on maintainer workflows: issue triage, pull request review,
release notes, dependency review, and security-oriented automation.

## Highlights

- Codex-oriented registry for Skills, plugin manifests, MCP server config, and
  GitHub Actions workflows.
- CI-friendly validation for `SKILL.md` frontmatter, plugin paths, and project
  policy.
- Safety audit rules for risky entry points, shell-based MCP servers, unpinned
  packages, broad tool exposure, insecure remote MCP hosts, potential secret
  literals, workflow token permissions, risky triggers, and unpinned actions.
- Safe mock execution for issue, pull request, release, dependency, security,
  and manual maintainer workflows.
- JSON, SARIF, and GitHub Actions annotation output for automation and code
  scanning integrations.
- Repository-relative SARIF locations with best-effort line hints for skills
  and MCP server definitions.
- JSON Schema catalog export for editor validation and downstream CI checks.
- Portable registry index export with project-relative paths.
- Stable issue codes, fix hints, policy allow/deny lists, suppressions, and
  baseline filtering for incremental adoption.
- Policy presets, starter policy generation, PR changed-file filtering,
  Markdown/HTML registry reports, static docs site generation, and pull request
  comment generation or opt-in publishing.
- Reusable GitHub Action plus published npm CLI/SDK for adoption in other open
  source repositories.

## Status

Version 0.6 validates, indexes, audits, exports schemas for, reports on, and
mock-runs workflow definitions. It does not execute arbitrary skill scripts.

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
- inspect `.github/workflows/*.yml` token permissions, action references, and
  high-risk triggers
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
node dist/cli.js pr-comment
node dist/cli.js site --out site
node dist/cli.js explain MCP_UNPINNED_NPX
node dist/cli.js schema --out codex-skills-registry.schema.json
```

During development:

```bash
npm run dev -- list
npm run dev -- export --out registry-index.json
npm run dev -- schema --out codex-skills-registry.schema.json
```

## CLI

```bash
codex-skills list
codex-skills validate [name]
codex-skills run <name> --trigger issue
codex-skills doctor
codex-skills audit
codex-skills export --out registry-index.json
codex-skills report --out codex-skills-report.md
codex-skills report --html --out codex-skills-report.html
codex-skills pr-comment --out codex-skills-pr-comment.md
codex-skills site --out site
codex-skills baseline --out codex-skills-baseline.json
codex-skills explain MCP_UNPINNED_NPX
codex-skills schema --out codex-skills-registry.schema.json
codex-skills schema policy --out codex-skills-policy.schema.json
codex-skills init-policy --preset recommended --out .codex-skills-registry.yaml
```

For machine-readable CI output:

```bash
codex-skills doctor --format json
codex-skills audit --format json
codex-skills doctor --format sarif
codex-skills doctor --github-annotations
```

## Project layout

```text
src/schema.ts         Zod schemas for skills, MCP servers, and plugin manifests
src/discovery.ts      Filesystem discovery for .agents/skills and .codex/config.toml
src/workflows.ts      GitHub Actions workflow discovery and audit rules
src/registry.ts       In-memory registry, validation, and JSON export
src/policy.ts         Project policy loading for .codex-skills-registry.yaml
src/issues.ts         Stable issue codes, fingerprints, baselines, suppressions
src/audit.ts          Safety checks for review-worthy registry risks
src/sarif.ts          SARIF conversion for Code Scanning integrations
src/json-schema.ts    JSON Schema export for editor and CI integrations
src/pr-comment.ts     Pull request comment formatting
src/github-comment.ts Opt-in GitHub PR comment publishing
src/site.ts           Static docs site generation
src/executor.ts       Safe mock executor
src/cli.ts            Commander-based CLI
examples/             Example maintainer workflows and MCP config
test/                 Vitest coverage for schemas, discovery, and registry behavior
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
- potential secret literals in MCP environment values, HTTP headers, and bearer
  token configuration
- MCP remote URL query credentials and non-portable auth environment variable
  names
- GitHub Actions workflows without explicit permissions
- broad workflow token permissions and `pull_request_target`
- unpinned workflow actions when policy requires full SHA pinning
- downloaded script execution pipelines in workflow `run` steps

## What it does not do

- execute community-contributed skill scripts
- prove that a third-party MCP server is safe
- replace Codex, the Codex app, or the Codex plugin directory
- publish or install plugins
- scan arbitrary source code for malicious behavior

## Project policy

Maintainers can add `.codex-skills-registry.yaml` to make CI stricter:

```yaml
extends:
  - recommended
requirePinnedMcpPackages: true
requirePinnedWorkflowActions: false
allowedMcpCommands:
  - node
  - python
  - uvx
deniedMcpCommands:
  - bash
allowedMcpServers:
  - context7
deniedPlugins:
  - experimental-plugin
allowedRemoteMcpHosts:
  - example.com
requireExplicitMcpToolPolicy: true
requirePluginSkillPaths: true
failOnWarnings: false
baselineFile: codex-skills-baseline.json
suppressions:
  - code: MCP_REMOTE_NOT_HTTPS
    file: .codex/config.toml
    reason: Local-only fixture reviewed by maintainers
    owner: security
    expiresOn: 2099-01-01
```

Policy is intentionally small. It should catch review-worthy risks
without pretending to prove that a third-party MCP server is safe.

Use `init-policy` to write a starter policy:

```bash
codex-skills init-policy --preset recommended --out .codex-skills-registry.yaml
```

Supported presets are `recommended`, `strict-mcp`, `plugin-review`, and
`strict-supply-chain`.

Use `baseline` when a repository already has known findings and you only want
CI to block newly introduced risks:

```bash
codex-skills baseline --strict --out codex-skills-baseline.json
codex-skills doctor --strict --baseline codex-skills-baseline.json
```

Every finding has a stable issue code and a deterministic fingerprint. Baseline
fingerprints are tied to the issue code, path, and file, so wording-only
message changes do not invalidate an existing baseline; older baseline files
remain compatible. Suppression globs use `*` for one path segment, `**` for
cross-directory matches, and `?` for one character. Use `explain` to inspect
the intent and remediation for common rules:

```bash
codex-skills explain MCP_UNPINNED_NPX
codex-skills explain WORKFLOW_UNPINNED_ACTION
```

## JSON Schema export

The `schema` command exports a Draft 2020-12 catalog containing the registry
schemas supported by this project:

```bash
codex-skills schema --out codex-skills-registry.schema.json
```

To export one schema document, pass its name as an argument:

```bash
codex-skills schema skill-frontmatter --out skill-frontmatter.schema.json
codex-skills schema policy --out codex-skills-policy.schema.json
codex-skills schema plugin-manifest --out codex-plugin-manifest.schema.json
```

Supported names are `skill-frontmatter`, `skill`, `policy`, `mcp-config`,
`mcp-server`, and `plugin-manifest`. The generated schemas describe the shapes
validated by `codex-skills-registry`; they are not a claim that every future
Codex or MCP field is known by this project.

## Add to a repository in 3 minutes

1. Add a project policy file:

```yaml
requirePinnedMcpPackages: true
requireExplicitMcpToolPolicy: true
requirePluginSkillPaths: true
failOnWarnings: false
```

2. Run the local check:

```bash
npx @wangjiehu/codex-skills-registry@latest doctor --policy .codex-skills-registry.yaml
```

3. Add the GitHub Action:

```yaml
name: codex-skills

on:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: wangjiehu/codex-skills-registry@v0.6.0
        with:
          path: .
          command: doctor
          policy: .codex-skills-registry.yaml
```

4. Review diagnostics before trusting new skills, plugin manifests, or MCP
   server definitions.

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
      - uses: wangjiehu/codex-skills-registry@v0.6.0
        with:
          path: .
          command: doctor
          policy: .codex-skills-registry.yaml
          format: text
          strict: "false"
```

Supported action commands are `doctor`, `validate`, `list`, `audit`, `export`,
`report`, `schema`, `pr-comment`, `baseline`, and `site`. The action emits
GitHub annotations for diagnostics, validation issues, and audit findings.

Action outputs include artifact paths plus active issue counts from the same
command summary used to generate the artifact or PR comment:

- `index-path`, `sarif-path`, `schema-path`, `report-path`, `comment-path`,
  `baseline-path`, `site-path`
- `issue-count`, `error-count`, `warning-count`, `suppressed-count`,
  `baseline-count`

To export a schema catalog or a single named schema from CI:

```yaml
- id: schema
  uses: wangjiehu/codex-skills-registry@v0.6.0
  with:
    path: .
    command: schema
    schema: policy
```

To upload SARIF to GitHub Code Scanning, run:

```yaml
- id: codex-skills
  uses: wangjiehu/codex-skills-registry@v0.6.0
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

For PR-focused checks, pass a newline-delimited changed-file list:

```bash
git diff --name-only origin/main...HEAD > changed-files.txt
codex-skills doctor --changed-files changed-files.txt
```

To create a Markdown summary for a CI artifact or repository documentation:

```bash
codex-skills report --out codex-skills-report.md
```

For a static HTML artifact:

```bash
codex-skills report --html --out codex-skills-report.html
```

To create a pull request comment body that another workflow step can post:

```bash
codex-skills pr-comment \
  --out codex-skills-pr-comment.md \
  --report-path codex-skills-registry-report.md \
  --sarif-path codex-skills-registry.sarif
```

To let the Action create or update the PR comment directly, grant the caller
workflow the narrow PR write permission and enable `post-comment`. For public
repositories, use trusted workflow/action code and scan the pull request
contents in a separate checkout:

```yaml
on:
  pull_request_target:

permissions:
  contents: read
  pull-requests: write

steps:
  - uses: actions/checkout@v6
    with:
      repository: ${{ github.event.pull_request.head.repo.full_name }}
      ref: ${{ github.event.pull_request.head.sha }}
      path: target
      persist-credentials: false
  - uses: wangjiehu/codex-skills-registry@v0.6.0
    with:
      path: target
      command: pr-comment
      post-comment: "true"
```

To publish a static registry site for GitHub Pages or an artifact:

```bash
codex-skills site --out site
```

The repository also includes workflows for registry artifacts, GitHub Pages
site generation, PR comment publishing, CodeQL, dependency review, and OpenSSF
Scorecard.

## Demo projects

The `demo/` directory includes a clean project and a risky project:

```bash
node dist/cli.js --cwd demo/clean-project --no-examples doctor
node dist/cli.js --cwd demo/risky-project --no-examples doctor --strict
```

The standalone demo repository is
[`wangjiehu/codex-skills-registry-demo`](https://github.com/wangjiehu/codex-skills-registry-demo).
It contains a clean default branch plus intentionally risky and baseline
adoption pull requests for public CI screenshots and reviewer walkthroughs.

For product planning and launch assets, see `docs/go-to-market.md` and
`docs/v1-readiness-checklist.md`.

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
npm run lint
npm run format:check
npm run pack:check
```

The GitHub Actions workflow runs lint, format checks, build, test, CLI smoke
tests, and smoke tests of the reusable action.

## Release

The package is configured as the public scoped package
`@wangjiehu/codex-skills-registry`. Before publishing from a new account,
confirm the account owns the `@wangjiehu` npm scope.

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

Automated releases run when a semver tag such as `v0.6.0` is pushed.
Configure npm Trusted Publishing for this GitHub Actions workflow instead of a
long-lived token:

- package: `@wangjiehu/codex-skills-registry`
- owner: `wangjiehu`
- repository: `codex-skills-registry`
- workflow file: `release.yml`
- allowed action: `npm publish`

Trusted publishing uses GitHub Actions OIDC and automatically generates npm
provenance for public packages. The release workflow also packs the npm tarball,
attests that exact artifact with GitHub build provenance, and publishes the
same tarball.
