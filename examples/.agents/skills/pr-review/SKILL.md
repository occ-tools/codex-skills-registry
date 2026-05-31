---
name: pr-review
description: Review pull requests for correctness, tests, maintainability, and release risk before a human maintainer signs off.
version: 0.1.0
author: codex-skills-registry
triggers:
  - pr
entryPoint: scripts/run.ts
tags:
  - maintainer
  - review
---

# Pull Request Review

Use this workflow for PR review assistance.

Focus on bugs, regressions, missing tests, compatibility concerns, and release
risk. Put actionable findings first, then summarize the change only after the
risk review is complete.
