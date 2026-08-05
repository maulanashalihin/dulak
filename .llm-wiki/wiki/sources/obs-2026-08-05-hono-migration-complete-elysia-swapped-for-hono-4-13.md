---
type: source
title: "Observation: Hono migration complete: Elysia swapped for Hono 4.13"
slug: obs-2026-08-05-hono-migration-complete-elysia-swapped-for-hono-4-13
status: observation
created: 2026-08-05
updated: 2026-08-05
relevance: critical
observed_at: 2026-08-05T01:14:21.413Z
tags: ["hono", "elysia", "migration", "architecture"]
source_context: "Migrating boilerplate from Elysia to Hono"
---
# 🔴 Observation: Hono migration complete: Elysia swapped for Hono 4.13
Boilerplate dulak-v2 fully migrated from Elysia 1.4.29 to Hono 4.13 (Bun.serve, app.fetch). Files rewritten: app.ts (composition: requestLogger -> checkOrigin -> secureHeaders -> inertiaMiddleware -> routes, onError/notFound), inertia.ts (framework-light adapter, set field dropped), inertia-plugin.ts -> inertia-middleware.ts (AppEnv Variables, c.var.user/flash/sessionToken/inertia), auth.ts (cookie helpers via generateCookie + c.res.headers.append, guards as Hono middleware with next()), security.ts (custom checkOrigin kept — Hono csrf() blocks missing-Origin form posts, breaking non-browser clients), rate-limit.ts (hand-rolled kept; hono/conninfo ESM is an empty stub in 4.13 so hono-rate-limiter's keyGenerator path is broken), validation.ts (new: TypeBox via createMiddleware + addValidatedData, ValidationFailed -> 422 Inertia payloads), 5 route files (sub-apps, no assets param), index.ts (Bun.serve). Tests ported to app.request(): 58 pass, tsc clean. Git re-initialized (history wiped by user), commit 0f39820. README/AGENTS.md/branding updated to Hono Inertia.
*Relevance: critical*

*Context: Migrating boilerplate from Elysia to Hono*

*Tags: hono elysia migration architecture*
---
*Observed: 2026-08-05T01:14:21.413Z*