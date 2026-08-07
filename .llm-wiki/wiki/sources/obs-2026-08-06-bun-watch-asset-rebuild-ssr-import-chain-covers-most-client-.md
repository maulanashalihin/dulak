---
type: source
title: "Observation: Bun --watch asset rebuild: SSR import chain covers most client files"
slug: obs-2026-08-06-bun-watch-asset-rebuild-ssr-import-chain-covers-most-client-
status: observation
created: 2026-08-06
updated: 2026-08-06
relevance: high
observed_at: 2026-08-06T02:00:41.190Z
tags: ["bun", "watch-mode", "assets", "inertia", "dev-workflow"]
---
# ⭐ Observation: Bun --watch asset rebuild: SSR import chain covers most client files
bun dev (bun --watch src/index.ts) watches the import graph of src/index.ts. Because src/server/inertia.ts imports ../client/ssr, and ssr.tsx -> pages.ts -> all page/component TSX + their CSS, nearly all frontend files already auto-restart + rebuild assets on edit. Two blind spots existed: src/client/app.tsx (browser Bun.build entry, not imported by server) and src/client/styles.css (only imported by app.tsx). Fixed styles.css blind spot by adding `import "./styles.css"` to ssr.tsx (no-op at runtime, but pulls styles.css into the watch graph). app.tsx remains a blind spot (rarely changed; touch src/index.ts to force rebuild).
*Relevance: high*

*Tags: bun watch-mode assets inertia dev-workflow*
---
*Observed: 2026-08-06T02:00:41.190Z*