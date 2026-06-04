# Go-To-Market Plan

## Positioning

`codex-skills-registry` is a CI safety and compatibility layer for repositories
that accept Codex Skills, plugin manifests, and MCP server configuration.

The core message:

> Review Codex/MCP automation before it becomes trusted repository automation.

## Primary Buyers

- Open-source maintainers who review contributed automation.
- Teams adopting Codex Skills or MCP servers in shared repositories.
- Security-conscious maintainers who want SARIF and GitHub annotation output.
- Tool authors who need schemas and fixtures for Codex/MCP compatibility.

## Adoption Path

1. Run `npx @wangjiehu/codex-skills-registry@latest doctor`.
2. Add `.codex-skills-registry.yaml` with `init-policy`.
3. Add the GitHub Action with `command: doctor`.
4. Generate a baseline if the repository already has known findings.
5. Upload SARIF, publish the Markdown/HTML report or static site, or post the PR comment directly.
6. Use `--changed-files`, suppressions, and policy allow/deny lists to reduce noise.

## Launch Assets

- README quick start.
- `demo/clean-project` and `demo/risky-project`.
- SARIF output example from the risky demo.
- GitHub Action YAML examples for doctor, schema, report, PR comment publishing, baseline, site, and SARIF upload.
- Security model and threat list in `SECURITY.md`.
- Public demo repository with clean, risky, baseline, and fork-comment workflow examples.
- GitHub Pages site generated from the live registry report, including a searchable rules catalog.

## Near-Term Roadmap

- Capture screenshots or short GIFs of annotations, SARIF, reports, Pages, and PR comments after demo runs complete.
- Add a short launch article with screenshots and adoption steps.
- Add integration examples for repositories that already run CodeQL and dependency review.

## Success Criteria

- A new maintainer can adopt the Action in ten minutes.
- Findings point to exact files and line numbers.
- Reports and SARIF are usable as CI artifacts without local path leakage.
- Baselines allow existing repositories to adopt without blocking on old risk.
- PR comment output gives reviewers a compact summary without reading raw logs.
- PR comment publishing uses narrow permissions and degrades to a warning when GitHub context cannot write.
- The tool never executes community skill scripts by default.
- The package, Action, demos, and docs all describe the same product boundary.
