# Release Troubleshooting

## npm Trusted Publishing after repository moves

The npm package is still published as `@wangjiehu/codex-skills-registry`, while
the GitHub repository now lives at `Hephaestus-DevKit/codex-skills-registry`.

If the release workflow passes validation, packs the tarball, attests
provenance, and then fails at `npm publish` with an npm `E404`, `Not Found -
PUT`, or permission-style message, check the npm package's Trusted Publisher
configuration before changing source code.

For this repository, the npm package publisher should be configured with:

- Provider: GitHub Actions
- GitHub organization/user: `occ-tools`
- GitHub repository: `codex-skills-registry`
- Workflow filename: `release.yml`
- Package: `@wangjiehu/codex-skills-registry`

After fixing the npm package settings, rerun only the failed workflow:

```bash
gh run rerun <run-id> --repo Hephaestus-DevKit/codex-skills-registry --failed
```

For the blocked `v1.0.5` release attempt, use:

```bash
gh run rerun 28357920802 --repo Hephaestus-DevKit/codex-skills-registry --failed
```

