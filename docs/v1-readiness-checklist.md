# v1 Readiness Checklist

## Product Surface

- [x] CLI supports list, validate, doctor, audit, export, schema, report, pr-comment, baseline, site, explain, and init-policy.
- [x] GitHub Action supports doctor, validate, list, audit, export, report, schema, pr-comment, baseline, and site.
- [x] SDK exports discovery, registry, workflow audit, GitHub comment publishing, site generation, schema, SARIF, report, PR comment, issue, baseline, and policy helpers.
- [x] Output supports text, JSON, SARIF, GitHub annotations, JSON Schema, Markdown/HTML reports, static docs sites, and PR comment bodies.
- [x] Registry indexes and reports use project-relative paths.

## Safety

- [x] Skill execution is mocked only.
- [x] Skill entry points are checked for path traversal.
- [x] Plugin skill and MCP paths are checked against the plugin root.
- [x] MCP shell commands, broad tool policy, unpinned npx packages, insecure remote transports, unapproved hosts, URL query credentials, invalid auth env var names, and possible secret literals are flagged.
- [x] GitHub Actions missing permissions, broad permissions, `pull_request_target`, unpinned actions, unsafe PR interpolation, and downloaded script execution are flagged.
- [x] Policy presets are available for recommended, strict MCP, plugin review, and strict supply-chain workflows.
- [x] Allow/deny policy is available for skills, plugins, MCP servers, MCP commands, and remote hosts.
- [x] Baselines and expiring suppressions are available for incremental adoption.

## Evidence

- [x] Clean and risky demo projects exist.
- [x] CI runs build, tests, CLI smoke checks, schema smoke checks, and Action smoke checks.
- [x] CodeQL, dependency review, OpenSSF Scorecard, PR comment, Pages, and release provenance workflows exist.
- [x] Workflow action references are pinned to full commit SHAs in this repository.
- [x] npm Trusted Publishing/OIDC release workflow is configured with artifact attestation for the packed tarball.
- [x] `npm audit --audit-level=moderate` reports zero known vulnerabilities.
- [x] Fixture coverage exists for monorepos, plugin-only projects, external plugin MCP JSON, remote MCP, and path traversal.
- [x] Generated report, schema, and index artifact workflows exist.

## Market Readiness

- [x] GitHub Action has Marketplace branding.
- [x] README includes quick start, policy, schema, report, SARIF, and demo workflows.
- [x] Security model describes threat coverage and out-of-scope behavior.
- [x] Go-to-market plan is documented.
- [x] GitHub Pages docs site generation is available through `codex-skills site` and the Pages workflow.
- [x] PR comment auto-publishing is available through `post-comment: "true"` with narrow `pull-requests: write` permissions.
- [ ] Add screenshots or copied examples of GitHub annotations and Code Scanning results after the first public demo PRs run.
- [x] Keep the standalone public demo repository synchronized with the latest tagged Action.

Owner-side launch work is tracked in `docs/OWNER_NEXT_STEPS.md`.
