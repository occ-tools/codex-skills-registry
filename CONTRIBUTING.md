# Contributing

Thanks for helping make Codex automation easier to review and reuse.

Please follow the project code of conduct in all issues, discussions, and pull
requests.

## Development setup

Use Node.js 20 or newer. The release workflow currently publishes with Node.js
24.

```bash
npm install
npm run validate
```

Useful commands:

```bash
npm run dev -- list
npm run dev -- doctor
npm run dev -- audit
npm run dev -- export --out registry-index.json
npm run dev -- report --out codex-skills-report.md
npm run dev -- pr-comment --out codex-skills-pr-comment.md
npm run dev -- baseline --out codex-skills-baseline.json
npm run dev -- explain MCP_UNPINNED_NPX
npm run dev -- schema --out codex-skills-registry.schema.json
npm run dev -- init-policy --preset recommended
```

## Pull request expectations

- Keep changes focused and explain the maintainer workflow being improved.
- Add or update tests for schema, discovery, registry, CLI, or audit behavior.
- Do not add real secrets, tokens, private URLs, or production credentials to examples.
- Prefer safe mock execution. Real script execution should be proposed separately with a clear sandboxing model.
- When adding example skills, include a realistic `SKILL.md` and keep scripts as harmless local templates.
- Keep core examples aligned with generic open-source maintainer workflows. See
  `docs/examples-governance.md` before proposing third-party service or
  platform-specific examples.

## Adding a skill example

The main `examples/` tree is for reusable maintainer automation patterns such as
issue triage, pull request review, release notes, dependency review, security
review, and repository policy checks.

Third-party service, social platform, vendor API, hosted connector, and
account-scoped workflow examples are not accepted into the core examples by
default. They may be reconsidered only if the project later adds a clearly
separated community or third-party examples area with explicit ownership and
disclaimers.

Create a directory under `examples/.agents/skills/<name>` with:

- `SKILL.md`
- optional `scripts/`
- optional `references/`
- optional `assets/`
- optional `agents/openai.yaml`

Then run:

```bash
npm run dev -- validate <name>
npm run dev -- audit
npm run validate
```

## Release checklist

- `npm run release:check`
- `npm run market:check` before public release or marketplace listing updates
- update `CHANGELOG.md` when one exists
- confirm the npm package scope is correct for the publishing account
- create a semver tag that exactly matches `package.json`, such as `v1.0.0`
- push the tag to trigger the release workflow, or publish manually with `npm publish --access public`
