---
type: source
title: "Observation: Inertia v3 in-process SSR adapter for Elysia"
slug: obs-2026-08-03-inertia-v3-in-process-ssr-adapter-for-elysia
status: observation
created: 2026-08-03
updated: 2026-08-03
relevance: high
observed_at: 2026-08-03T09:06:59.563Z
tags: ["inertia", "ssr", "react", "elysia"]
source_context: "Building SSR layer for elysia-inertia-boilerplate"
---
# ⭐ Observation: Inertia v3 in-process SSR adapter for Elysia
Hand-rolled Inertia v3 server adapter (src/server/inertia.ts) — no separate SSR server process: browser visits get full HTML via react-dom/server renderToString (createInertiaApp from @inertiajs/react v3.6, React 19), X-Inertia XHR gets JSON page payloads, 409 + X-Inertia-Location on asset-version mismatch, partial reloads via X-Inertia-Partial-* headers, one-shot flash merged into page payload. Asset version = sha256 of Bun.build outputs (dist/manifest.json). Bun 1.3 removed import.meta.glob — page registry uses explicit imports (src/client/pages.ts). Client hydrates when data-server-rendered present (src/client/app.tsx).
*Relevance: high*

*Context: Building SSR layer for elysia-inertia-boilerplate*

*Tags: inertia ssr react elysia*
---
*Observed: 2026-08-03T09:06:59.563Z*