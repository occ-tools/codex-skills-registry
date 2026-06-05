# codex-skills-registry standalone demo

This directory is a copy-ready demo repository template for
`@wangjiehu/codex-skills-registry`.

It demonstrates the product's clean path, baseline-ready configuration, SARIF
upload, static site artifact, same-repo pull request comment, and fork-safe pull
request comment workflows in GitHub Actions.

## What to try locally

From the product repository root:

```bash
node dist/cli.js --cwd demo/standalone-project --no-examples doctor
node dist/cli.js --cwd demo/standalone-project --no-examples audit --strict
node dist/cli.js --cwd demo/standalone-project --no-examples site --out demo/standalone-project/site
```

From a copied standalone repository:

```bash
npx @wangjiehu/codex-skills-registry@latest doctor
npx @wangjiehu/codex-skills-registry@latest audit --strict
npx @wangjiehu/codex-skills-registry@latest site --out site
```

## Running this demo in GitHub

Copy the contents of this directory into a temporary public repository when real
GitHub pull request behavior needs to be demonstrated. The nested
`.github/workflows` files then become normal repository workflows.

Use separate branches or pull requests for intentionally risky and baseline
adoption scenarios. Keep this in-repo directory as the maintenance source, and
treat any copied repository as disposable public evidence.

## GitHub Actions

The included workflows run registry doctor, upload SARIF, publish a PR comment,
and generate a Pages-ready static site artifact.

Same-repo pull requests publish comments from the normal `pull_request`
workflow. Forked pull requests use the separate `codex-skills-fork-comment`
workflow, which runs on `pull_request_target`, checks out fork contents without
credentials, and uses a registry action reference pinned to a published release
commit.
