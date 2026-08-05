---
type: source
title: "Observation: Sidebar full-reload cause: Inertia dev version negotiation"
slug: obs-2026-08-04-sidebar-full-reload-cause-inertia-dev-version-negotiation
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: medium
observed_at: 2026-08-04T06:25:31.477Z
tags: ["dulak", "inertia", "dev", "versioning", "reload"]
source_context: "Diagnosing sidebar full reload"
---
# 🔍 Observation: Sidebar full-reload cause: Inertia dev version negotiation
User reported sidebar clicks doing full page reloads instead of Inertia SPA navigation. Root cause: NOT a bug — bun --watch rebuilds client assets on every source change (assets.ts computes Inertia version = sha256 of js+css), so an already-open tab holds a stale version; the first Inertia request gets 409 + X-Inertia-Location and Inertia deliberately full-reloads to re-sync (documented 'stale clients get a 409 and reload'). Once the server settles, the version is stable and navigation is SPA again. Added README note under Notes/decisions. In production (prebuilt assets) this never happens.
*Relevance: medium*

*Context: Diagnosing sidebar full reload*

*Tags: dulak inertia dev versioning reload*
---
*Observed: 2026-08-04T06:25:31.477Z*