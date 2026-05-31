---
name: issue-triage
description: Triage GitHub issues by classifying intent, extracting maintainer actions, and drafting a concise response.
version: 0.1.0
author: codex-skills-registry
triggers:
  - issue
entryPoint: scripts/run.ts
tags:
  - maintainer
  - triage
---

# Issue Triage

Use this workflow when a maintainer needs to quickly understand a new or updated
GitHub issue.

1. Summarize the report in one paragraph.
2. Classify it as bug, feature, docs, support, security, or unclear.
3. Identify missing reproduction details.
4. Suggest labels and the next maintainer action.
5. Draft a short response that asks only for necessary details.
