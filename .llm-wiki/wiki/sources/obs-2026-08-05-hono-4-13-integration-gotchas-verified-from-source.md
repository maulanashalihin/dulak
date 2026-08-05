---
type: source
title: "Observation: Hono 4.13 integration gotchas (verified from source)"
slug: obs-2026-08-05-hono-4-13-integration-gotchas-verified-from-source
status: observation
created: 2026-08-05
updated: 2026-08-05
relevance: high
observed_at: 2026-08-05T01:14:22.342Z
tags: ["hono", "gotchas", "tus", "cookies", "rate-limit"]
source_context: "Porting Elysia app to Hono 4.13"
---
# ⭐ Observation: Hono 4.13 integration gotchas (verified from source)
Verified in hono 4.13 source (node_modules/hono/dist): 1) HEAD requests are re-dispatched as GET (body stripped, headers kept) but c.req.method still reports 'HEAD' — tus dispatch relies on this to route HEAD correctly. 2) c.header()-queued headers (incl. setCookie) are DROPPED when a handler returns a custom Response: context.res setter only merges c.res headers when #res was already created. Fix: cookie helpers append to c.res.headers directly (auth.ts). 3) Tail wildcard '/*' produces NO named param (param('*') is undefined; the trie node inserts an empty name) — derive path segments from c.req.path (uploads.routes.ts routeId). 4) hono/conninfo ESM build (dist/helper/conninfo/index.js) is a 0-byte stub in 4.13 — getConnInfo unusable; rate limiter reads peer IP from c.env (Bun server passed as 2nd fetch arg). 5) Middleware MUST call next() to continue; returning undefined without next() errors 'Context is not finalized'.
*Relevance: high*

*Context: Porting Elysia app to Hono 4.13*

*Tags: hono gotchas tus cookies rate-limit*
---
*Observed: 2026-08-05T01:14:22.342Z*