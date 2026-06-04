# Fork PR Validation

Public repositories need two separate pull request paths:

- required validation on `pull_request`, where forked pull requests receive a
  restricted token;
- optional comment publishing on `pull_request_target`, where the workflow has
  write permission and must not execute untrusted pull request code.

## Workflow Contract

The fork-comment workflow should meet all of these requirements:

- grant only `contents: read` and `pull-requests: write`;
- use trusted workflow and action code from the base repository or a pinned
  release reference;
- checkout pull request contents into a separate directory;
- set `persist-credentials: false` on the pull request checkout;
- run only static registry inspection against the pull request contents;
- avoid `npm install`, project scripts, shell interpolation, or dependency
  execution from the pull request contents.

## Validation Matrix

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| Clean default branch | Registry workflow succeeds | Demo `main` push check |
| Risky same-repo PR | Registry doctor fails and posts findings | `demo/risky-mcp` pull request |
| Baseline same-repo PR | Registry doctor succeeds with baselined findings | `demo/baseline-adoption` pull request |
| Fork PR | Required validation runs with restricted token; fork-comment workflow posts or updates the registry summary | Requires an external fork account or organization |

## Manual Fork Test

1. Fork `wangjiehu/codex-skills-registry-demo` from an account or organization
   that is not the base repository owner.
2. Create a branch that changes only Codex Skill, plugin, MCP, or workflow
   files.
3. Open a pull request back to the demo repository.
4. Confirm the `pull_request` validation workflow does not rely on write-token
   comment publishing for forked pull requests.
5. Confirm the fork-comment workflow posts or updates one registry summary
   comment and does not run project scripts from the fork contents.

The existing same-repo demo pull requests verify product behavior, but they do
not prove GitHub's fork token boundary. The fork test needs a genuinely separate
GitHub owner to be meaningful.
