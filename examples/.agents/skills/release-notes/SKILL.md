---
name: release-notes
description: Generate release notes from merged pull requests, issue links, migration notes, and maintainer-authored highlights.
version: 0.1.0
author: codex-skills-registry
triggers:
  - release
entryPoint: scripts/run.ts
tags:
  - maintainer
  - release
---

# Release Notes

Use this workflow when preparing a release.

Group changes into breaking changes, features, fixes, documentation, internal
maintenance, and acknowledgements. Keep migration notes explicit and link back
to source pull requests when available.
