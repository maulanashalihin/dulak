---
type: source
title: "Observation: Dev-only SSE hot-reload on bun --watch restart"
slug: obs-2026-08-06-dev-only-sse-hot-reload-on-bun-watch-restart
status: observation
created: 2026-08-06
updated: 2026-08-06
relevance: high
observed_at: 2026-08-06T02:56:53.186Z
tags: ["bun", "watch-mode", "sse", "hot-reload", "inertia", "dev-workflow"]
source_context: "Adding SSE-based browser auto-reload for bun dev watch mode"
---
# ⭐ Observation: Dev-only SSE hot-reload on bun --watch restart
Added dev-only SSE hot-reload so browser tabs auto-reload when bun --watch restarts. New module src/server/dev-reload.ts exports devReloadStream() — a ReadableStream SSE response with retry:500ms + 15s heartbeat. Route registered in app.ts only when !config.isProd. inertia.ts html() injects an inline EventSource client script only when !config.isProd: first open just records connected state; on reconnect (second open, after the restart killed the connection) it calls location.reload() to pick up freshly built hashed assets. The signal is the drop+reconnect itself — server never sends a reload event. Production untouched: route not registered, script not injected, zero overhead. /dev-reload added to logger SILENT_PATHS. CSP connect-src 'self' allows same-origin EventSource; script-src 'unsafe-inline' covers the inline script. compress.ts skips event-stream (not /assets/ nor text/html). Verified: SSE returns text/event-stream with retry:500; login HTML contains the script in dev, absent in prod; /dev-reload 404s in prod. 62 tests green, typecheck clean.
*Relevance: high*

*Context: Adding SSE-based browser auto-reload for bun dev watch mode*

*Tags: bun watch-mode sse hot-reload inertia dev-workflow*
---
*Observed: 2026-08-06T02:56:53.186Z*