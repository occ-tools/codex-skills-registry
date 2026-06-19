# Marketplace Evidence

This file records copied release-readiness evidence for the public package and
GitHub Action listing. It is intentionally text-based so maintainers can review
it in Git, without relying on screenshots that go stale quickly.

Refreshed on 2026-06-20 after the v1.0.4 maintenance release.

## Local Gates

`npm run market:check`

```text
18 test files passed
103 tests passed
npm pack --dry-run completed
npm audit --audit-level=moderate found 0 vulnerabilities
```

Packed package install smoke:

```text
npm pack --pack-destination <temp>
npm install <packed-tarball> --ignore-scripts
npx codex-skills --version
npx codex-skills --help
```

Result:

```text
1.0.4
Usage: codex-skills [options] [command]

Validate, index, and mock-run Codex Skills, plugins, MCP configs, and workflow
risk.
```

## GitHub Actions Evidence

Latest verified main-branch checks:

| Workflow | Result | Evidence |
| --- | --- | --- |
| validate | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27837062780 |
| codeql | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27837062782 |
| pages | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27837062781 |
| registry-artifacts | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27837062791 |
| scorecard | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27759771438 |
| release | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27837556431 |

The validate workflow covered Node.js 20, 22, and 24 on Ubuntu, Windows, and
macOS, plus reusable Action smoke tests for doctor, schema, report, PR comment,
baseline, and site commands.

## Pull Request Comment Evidence

The split PR analysis and trusted `workflow_run` publisher posted an escaped
no-findings summary on a public pull request:

https://github.com/wangjiehu/codex-skills-registry/pull/19#issuecomment-4753240784

Copied summary:

```text
No active findings
Skills: 3
MCP servers: 3
Plugins: 1
Workflows: 9
Errors: 0
Warnings: 0
Suppressed: 0
Baseline: 0
```

## npm Provenance Evidence

The published `1.0.4` package includes npm provenance metadata. The release
workflow published through Trusted Publishing/OIDC after verifying that the
release tag matched the package version and attesting the packed tarball.

Copied `npm view @wangjiehu/codex-skills-registry@1.0.4 dist --json` fields:

```json
{
  "attestations": {
    "url": "https://registry.npmjs.org/-/npm/v1/attestations/@wangjiehu%2fcodex-skills-registry@1.0.4",
    "provenance": {
      "predicateType": "https://slsa.dev/provenance/v1"
    }
  }
}
```
