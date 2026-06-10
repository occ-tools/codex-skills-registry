# Example Governance

The examples in this repository are part of the public product surface. They
should demonstrate reusable maintainer automation patterns that help reviewers
understand, validate, and audit Codex Skills, plugin manifests, MCP
configuration, or GitHub Actions workflows.

## Core examples

Core examples should be broadly useful to open-source maintainers. Good fits
include:

- issue triage, pull request review, release notes, and dependency review;
- security review, vulnerability intake, and policy compliance workflows;
- repository automation that demonstrates registry validation, audit, reports,
  SARIF, PR comments, or GitHub Actions integration;
- minimal mock scripts that prove routing and metadata without executing
  untrusted automation.

Core examples must:

- avoid real credentials, tokens, private URLs, and production endpoints;
- keep scripts as harmless local templates unless a future sandboxing policy
  explicitly allows real execution;
- document any sensitive action boundary such as writes, private reads,
  monitoring, webhooks, or usage-impacting operations;
- include tests or registry expectations when the example changes discovery,
  validation, or report output.

## Third-party and platform-specific examples

Third-party service examples can be useful, but they are not automatically a fit
for the main `examples/` directory. Platform-specific examples raise additional
questions about endorsement, API terms, data handling, and maintenance
ownership.

Examples centered on a named service, social platform, vendor API, hosted
connector, or account-scoped workflow should stay out of the core examples
unless the project has a dedicated community or third-party examples area with
clear governance.

Before accepting that kind of contribution, maintainers should require:

- a clear explanation of why the example belongs in this repository instead of
  the contributor's own project;
- an explicit statement that the repository does not endorse the service;
- links to current public API or platform policy documentation when endpoint
  behavior matters;
- clear handling for credentials, private data, writes, monitoring, webhooks,
  extraction jobs, and usage-impacting actions;
- an identified maintainer or contributor willing to keep the example current.

## Decision rule

When in doubt, keep the core examples small and generic. Contributors can still
use `codex-skills-registry` to validate their own Skills in their own
repositories without having those service-specific workflows included here.
