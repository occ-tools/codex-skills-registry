# codex-skills-registry demo

This directory contains two small repositories for product demos and manual QA.

## Clean project

```bash
node dist/cli.js --cwd demo/clean-project --no-examples doctor
node dist/cli.js --cwd demo/clean-project --no-examples report
node dist/cli.js --cwd demo/clean-project --no-examples pr-comment
```

Expected result: one valid skill, one MCP server, no findings.

## Risky project

```bash
node dist/cli.js --cwd demo/risky-project --no-examples doctor --strict
node dist/cli.js --cwd demo/risky-project --no-examples --format sarif doctor --strict
node dist/cli.js --cwd demo/risky-project --no-examples pr-comment
node dist/cli.js --cwd demo/risky-project --no-examples baseline --strict --out codex-skills-baseline.json
```

Expected result: findings for invalid skill metadata, an escaped entry point,
shell-based MCP execution, broad tool approval, missing explicit tool policy,
and a possible secret literal.
