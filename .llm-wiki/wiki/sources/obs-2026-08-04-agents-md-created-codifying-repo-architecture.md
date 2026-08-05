---
type: source
title: "Observation: AGENTS.md created codifying repo architecture"
slug: obs-2026-08-04-agents-md-created-codifying-repo-architecture
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: high
observed_at: 2026-08-04T03:08:14.931Z
tags: ["elysia-inertia-boilerplate", "agents", "architecture", "conventions"]
source_context: "Creating AGENTS.md after tus restructure"
---
# ⭐ Observation: AGENTS.md created codifying repo architecture
Created AGENTS.md at repo root to prevent AI agents from inventing their own layout (after a previous agent made src/server/tus/ violating conventions). Codifies: routes live in src/server/routes/<feature>.routes.ts with handlers inline; src/server/ is flat except routes/ (shared logic = flat modules like auth.ts, security.ts, tus-protocol.ts); all SQL prepared statements in db.ts; schema via numbered migrations/000N_*.sql never edited; env read once in config.ts; TypeBox validation; verbatimModuleSyntax so import type is mandatory; Elysia 1.4 quirks (hook order, rate-limit hand-rolled); testing must run 'bun test --isolate' (cross-file db singleton + config env caching gotcha); style 2-space/single-quotes/no-semicolons. README Architecture section links to it.
*Relevance: high*

*Context: Creating AGENTS.md after tus restructure*

*Tags: elysia-inertia-boilerplate agents architecture conventions*
---
*Observed: 2026-08-04T03:08:14.931Z*