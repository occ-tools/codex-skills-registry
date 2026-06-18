# Fork PR Validation

Public repositories need two separate pull request paths:

- required validation on `pull_request`, where forked pull requests receive a
  restricted token;
- optional comment publishing on `workflow_run`, where trusted default-branch
  code can receive write permission after read-only analysis completes.

## Workflow Contract

The analysis workflow should meet all of these requirements:

- grant only `contents: read`;
- use trusted workflow and action code from the base repository or a full
  release commit SHA;
- checkout pull request contents into a separate directory;
- set `persist-credentials: false` on the pull request checkout;
- run only static registry inspection against the pull request contents;
- avoid `npm install`, project scripts, shell interpolation, or dependency
  execution from the pull request contents;
- upload only the generated summary artifact.

The publishing workflow should:

- run from the default branch with only `actions: read`, `contents: read`, and
  `pull-requests: write`;
- download the artifact by the completed analysis run ID;
- treat artifact contents as untrusted data;
- escape HTML, mentions, and active Markdown before posting;
- never execute, import, source, or interpolate artifact contents into a shell.

## Validation Matrix

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| Clean default branch | Registry workflow succeeds | Temporary copy of `demo/standalone-project` on `main` |
| Risky same-repo PR | Registry doctor fails and posts findings | Risky branch or PR in a temporary standalone demo copy |
| Baseline same-repo PR | Registry doctor succeeds with baselined findings | Baseline adoption branch or PR in a temporary standalone demo copy |
| Fork PR | Required validation runs with a restricted token; trusted `workflow_run` publishes an escaped summary | Requires an external fork account or organization |

## Manual Fork Test

1. Copy `demo/standalone-project` to a temporary public repository.
2. Fork that temporary repository from an account or organization that is not
   the base repository owner.
3. Create a branch that changes only Codex Skill, plugin, MCP, or workflow
   files.
4. Open a pull request back to the temporary repository.
5. Confirm the `pull_request` validation workflow does not rely on write-token
   comment publishing for forked pull requests.
6. Confirm the trusted publishing workflow posts or updates one escaped
   registry summary and never executes artifact or fork contents.

The existing same-repo demo pull requests verify product behavior, but they do
not prove GitHub's fork token boundary. The fork test needs a genuinely separate
GitHub owner to be meaningful. Keep `demo/standalone-project` as the source for
any temporary demo copy so workflow examples do not drift from the product
repository.
