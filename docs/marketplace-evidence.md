# Marketplace Evidence

This file records copied release-readiness evidence for the public package and
GitHub Action listing. It is intentionally text-based so maintainers can review
it in Git, without relying on screenshots that go stale quickly.

Recorded on 2026-06-10 during the v1.0.0 release preparation.

## Local Gates

`npm run market:check`

```text
17 test files passed
89 tests passed
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
1.0.0
Usage: codex-skills [options] [command]

Validate, index, and mock-run Codex Skills, plugins, MCP configs, and workflow
risk.
```

## GitHub Actions Evidence

Latest verified main-branch checks before the v1.0.0 release preparation:

| Workflow | Result | Evidence |
| --- | --- | --- |
| validate | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27264299269 |
| codeql | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27264299264 |
| pages | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27264299258 |
| registry-artifacts | success | https://github.com/wangjiehu/codex-skills-registry/actions/runs/27264299660 |

The validate workflow covered Node.js 20, 22, and 24 on Ubuntu, Windows, and
macOS, plus reusable Action smoke tests for doctor, schema, report, PR comment,
baseline, and site commands.

## Pull Request Comment Evidence

The registry PR comment workflow posted a no-findings summary on a public pull
request:

https://github.com/wangjiehu/codex-skills-registry/pull/4#issuecomment-4660659450

Copied summary:

```text
No active findings
Skills: 4
MCP servers: 3
Plugins: 1
Workflows: 8
Errors: 0
Warnings: 0
Suppressed: 1
Baseline: 0
```

## npm Provenance Evidence

The published `0.6.3` package already includes npm provenance metadata. The
v1.0.0 release workflow uses the same Trusted Publishing and artifact
attestation path, with an added tag/version guard.

Copied `npm view @wangjiehu/codex-skills-registry@0.6.3 dist --json` fields:

```json
{
  "attestations": {
    "url": "https://registry.npmjs.org/-/npm/v1/attestations/@wangjiehu%2fcodex-skills-registry@0.6.3",
    "provenance": {
      "predicateType": "https://slsa.dev/provenance/v1"
    }
  }
}
```
