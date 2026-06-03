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
4. Upload SARIF or publish the Markdown report as a CI artifact.
5. Use `--changed-files` in pull request workflows to reduce noise.

## Launch Assets

- README quick start.
- `demo/clean-project` and `demo/risky-project`.
- SARIF output example from the risky demo.
- GitHub Action YAML examples for doctor, schema, report, and SARIF upload.
- Security model and threat list in `SECURITY.md`.

## Near-Term Roadmap

- Add more real-world fixtures for common MCP and plugin layouts.
- Add a generated docs page from `codex-skills report`.
- Add stricter deny-list policy options for MCP commands and environment names.
- Add PR comment mode after changed-file output proves low-noise.

## Success Criteria

- A new maintainer can adopt the Action in ten minutes.
- Findings point to exact files and line numbers.
- Reports and SARIF are usable as CI artifacts without local path leakage.
- The tool never executes community skill scripts by default.
- The package, Action, demos, and docs all describe the same product boundary.
