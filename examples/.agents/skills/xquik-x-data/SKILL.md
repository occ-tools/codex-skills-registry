---
name: xquik-x-data
description: Plan safe Xquik X/Twitter data workflows with API-key handling, source-truth checks, and explicit approval gates.
version: 0.1.0
author: Xquik-dev
triggers:
  - manual
entryPoint: scripts/run.ts
tags:
  - social-data
  - x
  - mcp
  - api
---

# Xquik X Data

Use this workflow when a maintainer or agent needs to plan X/Twitter data
research, media downloads, monitoring, webhooks, or account-scoped X actions
through Xquik.

1. Confirm that the user will provide a Xquik API key through `XQUIK_API_KEY`
   or a secure client secret store.
2. Check the current public docs before relying on endpoint names, fields,
   limits, setup steps, or usage estimates.
3. Prefer the configured Xquik MCP connector when it is already available.
4. Use `https://xquik.com/api/v1` for REST workflows that need explicit
   endpoint control.
5. Ask for explicit approval before private reads, writes, deletes, monitors,
   webhooks, extraction jobs, or usage-impacting actions.
6. Include the exact target, action, query or payload, delivery destination,
   and usage estimate when asking for approval.

Never request X passwords, cookies, 2FA codes, recovery codes, session tokens,
or browser exports. Keep private results minimal and do not forward private X
content to other tools without consent.
