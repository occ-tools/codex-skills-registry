# v1 Readiness Checklist

## Product Surface

- [x] CLI supports list, validate, doctor, audit, export, schema, report, and init-policy.
- [x] GitHub Action supports doctor, validate, list, audit, export, report, and schema.
- [x] SDK exports discovery, registry, audit, schema, SARIF, report, and policy helpers.
- [x] Output supports text, JSON, SARIF, GitHub annotations, JSON Schema, and Markdown reports.
- [x] Registry indexes and reports use project-relative paths.

## Safety

- [x] Skill execution is mocked only.
- [x] Skill entry points are checked for path traversal.
- [x] Plugin skill and MCP paths are checked against the plugin root.
- [x] MCP shell commands, broad tool policy, unpinned npx packages, and possible secret literals are flagged.
- [x] Policy presets are available for recommended, strict MCP, and plugin review workflows.
- [ ] Add deny-listed command and environment variable policy options.
- [ ] Add more remote MCP host and transport checks.

## Evidence

- [x] Clean and risky demo projects exist.
- [x] CI runs build, tests, CLI smoke checks, schema smoke checks, and Action smoke checks.
- [x] CodeQL and dependency review workflows exist.
- [x] `npm audit --audit-level=moderate` reports zero known vulnerabilities.
- [ ] Add fixture coverage for monorepos and more plugin bundle layouts.
- [ ] Add generated report artifact examples.

## Market Readiness

- [x] GitHub Action has Marketplace branding.
- [x] README includes quick start, policy, schema, report, SARIF, and demo workflows.
- [x] Security model describes threat coverage and out-of-scope behavior.
- [x] Go-to-market plan is documented.
- [ ] Add screenshots or copied examples of GitHub annotations and Code Scanning results.
- [ ] Add a public demo repository if a separate repo is desired.
