# codex-skills-registry demo

This directory keeps demo fixtures and copy-ready demo assets in the product
repository, so the main package remains the maintenance source.

## Local clean project

```bash
node dist/cli.js --cwd demo/clean-project --no-examples doctor
node dist/cli.js --cwd demo/clean-project --no-examples report
node dist/cli.js --cwd demo/clean-project --no-examples pr-comment
```

Expected result: one valid skill, one MCP server, no findings.

## Local risky project

```bash
node dist/cli.js --cwd demo/risky-project --no-examples doctor --strict
node dist/cli.js --cwd demo/risky-project --no-examples --format sarif doctor --strict
node dist/cli.js --cwd demo/risky-project --no-examples pr-comment
node dist/cli.js --cwd demo/risky-project --no-examples baseline --strict --out codex-skills-baseline.json
```

Expected result: findings for invalid skill metadata, an escaped entry point,
shell-based MCP execution, broad tool approval, missing explicit tool policy,
and a possible secret literal.

## Standalone demo template

`standalone-project/` is a copy-ready repository template for GitHub Actions
demos. It contains a clean default project, pinned registry Action workflows,
SARIF upload, same-repository PR comment publishing, and a static site artifact
workflow. Fork pull requests retain read-only validation; repositories that
need fork comments should add the trusted `workflow_run` pattern documented in
`docs/fork-pr-validation.md`.

There is no separate companion demo repository to keep synchronized. Copy this
directory only when GitHub's real pull request and fork permission boundaries
need to be demonstrated.
