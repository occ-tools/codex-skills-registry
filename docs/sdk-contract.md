# SDK Contract

`@wangjiehu/codex-skills-registry` exposes a small SDK for repository
automation, CI integrations, and documentation generators.

## Recommended Public Surface

Use these exports for new integrations:

- `SkillsRegistry` for loading a project, listing discovered assets, validating
  skills, auditing registry risk, and exporting indexes.
- `auditRegistry`, `auditSkill`, and `auditMcpServer` for focused safety checks.
- `createRegistryReport`, `formatRegistryReportMarkdown`, and
  `formatRegistryReportHtml` for generated reports.
- `formatPullRequestComment` and `publishPullRequestComment` for PR summaries.
- `createSarifLog` for Code Scanning integrations.
- `createRegistryJsonSchemaCatalog` and `createRegistryJsonSchema` for editor
  and CI schema export.
- `loadRegistryPolicy`, `resolveRegistryPolicy`, and
  `formatRegistryPolicyYaml` for policy workflows.
- `createIssueBaseline`, `applyIssuePolicyFilters`, and `issueFingerprint` for
  baseline and suppression workflows.
- `writeRegistrySite` for static documentation sites.

## Compatibility Exports

The package still exports low-level utility helpers for compatibility with early
adopters. New integrations should avoid depending on `utils` exports directly;
they are implementation helpers and may be narrowed in the next major version.

## Stability Policy

- Patch releases should not remove exports or change CLI/Action defaults.
- Minor releases may add commands, options, rules, report fields, or stricter
  tests, but should preserve existing adoption paths.
- A `1.0.0` release should first freeze the recommended public surface above
  and document any removed compatibility exports in the changelog.
