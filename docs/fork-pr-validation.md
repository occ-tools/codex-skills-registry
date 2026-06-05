# Fork PR Validation

Public repositories need two separate pull request paths:

- required validation on `pull_request`, where forked pull requests receive a
  restricted token;
- optional comment publishing on `pull_request_target`, where the workflow has
  write permission and must not execute untrusted pull request code.

## Workflow Contract

The fork-comment workflow should meet all of these requirements:

- grant only `contents: read` and `pull-requests: write`;
- use trusted workflow and action code from the base repository or a full
  release commit SHA;
- checkout pull request contents into a separate directory;
- set `persist-credentials: false` on the pull request checkout;
- run only static registry inspection against the pull request contents;
- avoid `npm install`, project scripts, shell interpolation, or dependency
  execution from the pull request contents.

## Validation Matrix

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| Clean default branch | Registry workflow succeeds | Temporary copy of `demo/standalone-project` on `main` |
| Risky same-repo PR | Registry doctor fails and posts findings | Risky branch or PR in a temporary standalone demo copy |
| Baseline same-repo PR | Registry doctor succeeds with baselined findings | Baseline adoption branch or PR in a temporary standalone demo copy |
| Fork PR | Required validation runs with restricted token; fork-comment workflow posts or updates the registry summary | Requires an external fork account or organization |

## Manual Fork Test

1. Copy `demo/standalone-project` to a temporary public repository.
2. Fork that temporary repository from an account or organization that is not
   the base repository owner.
3. Create a branch that changes only Codex Skill, plugin, MCP, or workflow
   files.
4. Open a pull request back to the temporary repository.
5. Confirm the `pull_request` validation workflow does not rely on write-token
   comment publishing for forked pull requests.
6. Confirm the fork-comment workflow posts or updates one registry summary
   comment and does not run project scripts from the fork contents.

The existing same-repo demo pull requests verify product behavior, but they do
not prove GitHub's fork token boundary. The fork test needs a genuinely separate
GitHub owner to be meaningful. Keep `demo/standalone-project` as the source for
any temporary demo copy so workflow examples do not drift from the product
repository.
