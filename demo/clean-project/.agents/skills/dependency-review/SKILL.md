---
name: dependency-review
description: Review dependency changes for maintainer risk before a pull request is merged.
version: 0.1.0
triggers:
  - dependency
entryPoint: scripts/run.ts
tags:
  - maintainer
  - dependency
---

# Dependency Review

Use this workflow to summarize dependency updates, identify release risk, and
draft a concise maintainer decision.
