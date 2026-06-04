# v1 Readiness Checklist

## Product Surface

- [x] CLI supports list, validate, doctor, audit, export, schema, report, pr-comment, baseline, explain, and init-policy.
- [x] GitHub Action supports doctor, validate, list, audit, export, report, schema, pr-comment, and baseline.
- [x] SDK exports discovery, registry, audit, schema, SARIF, report, PR comment, issue, baseline, and policy helpers.
- [x] Output supports text, JSON, SARIF, GitHub annotations, JSON Schema, Markdown/HTML reports, and PR comment bodies.
- [x] Registry indexes and reports use project-relative paths.

## Safety

- [x] Skill execution is mocked only.
- [x] Skill entry points are checked for path traversal.
- [x] Plugin skill and MCP paths are checked against the plugin root.
- [x] MCP shell commands, broad tool policy, unpinned npx packages, insecure remote transports, unapproved hosts, and possible secret literals are flagged.
- [x] Policy presets are available for recommended, strict MCP, and plugin review workflows.
- [x] Allow/deny policy is available for skills, plugins, MCP servers, MCP commands, and remote hosts.
- [x] Baselines and expiring suppressions are available for incremental adoption.

## Evidence

- [x] Clean and risky demo projects exist.
- [x] CI runs build, tests, CLI smoke checks, schema smoke checks, and Action smoke checks.
- [x] CodeQL and dependency review workflows exist.
- [x] `npm audit --audit-level=moderate` reports zero known vulnerabilities.
- [x] Fixture coverage exists for monorepos, plugin-only projects, external plugin MCP JSON, remote MCP, and path traversal.
- [x] Generated report, schema, and index artifact workflows exist.

## Market Readiness

- [x] GitHub Action has Marketplace branding.
- [x] README includes quick start, policy, schema, report, SARIF, and demo workflows.
- [x] Security model describes threat coverage and out-of-scope behavior.
- [x] Go-to-market plan is documented.
- [ ] Add screenshots or copied examples of GitHub annotations and Code Scanning results.
- [ ] Add a public demo repository if a separate repo is desired.
