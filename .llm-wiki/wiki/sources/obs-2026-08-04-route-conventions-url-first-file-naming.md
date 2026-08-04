---
type: source
title: "Observation: Route conventions: URL-first file naming"
slug: obs-2026-08-04-route-conventions-url-first-file-naming
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: high
observed_at: 2026-08-04T03:26:28.553Z
tags: ["elysia-inertia-boilerplate", "routes", "architecture", "conventions", "discoverability"]
source_context: "Defining route conventions for URL-first discovery"
---
# ⭐ Observation: Route conventions: URL-first file naming
Route organization in src/server/routes/ now follows URL-first discoverability: every URL lives in exactly ONE route file (GET renders + POST actions together). Merged GET /login|register|forgot-password|reset-password from pages.routes.ts into auth.routes.ts (previously split across two files — pasting /login gave no single answer). Renamed tus.routes.ts -> uploads.routes.ts and oauth.routes.ts -> google-oauth.routes.ts so file names derive from URL segments. pages.routes.ts is now app-shell only (/, /dashboard, /admin) — new feature pages get routes/<feature>.routes.ts (e.g. /posts -> posts.routes.ts). Infra endpoints (/health, /assets/*) stay in app.ts. Codified in AGENTS.md 'Route conventions' section + README tree. Note: GET auth form pages are now rate-limited (auth.routes.ts plugin-level limiter, 10/min default) — acceptable side effect.
*Relevance: high*

*Context: Defining route conventions for URL-first discovery*

*Tags: elysia-inertia-boilerplate routes architecture conventions discoverability*
---
*Observed: 2026-08-04T03:26:28.553Z*