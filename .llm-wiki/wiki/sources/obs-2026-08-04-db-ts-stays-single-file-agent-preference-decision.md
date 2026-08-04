---
type: source
title: "Observation: db.ts stays single file — agent-preference decision"
slug: obs-2026-08-04-db-ts-stays-single-file-agent-preference-decision
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: high
observed_at: 2026-08-04T03:17:10.742Z
tags: ["elysia-inertia-boilerplate", "db", "architecture", "agents"]
source_context: "Deciding db.ts split after tus restructure"
---
# ⭐ Observation: db.ts stays single file — agent-preference decision
Decided NOT to split src/server/db.ts into db/<domain>.ts. Owner asked for honest AI-agent preference: a single coherent module reads better than a tree of small domain files (context locality, cross-domain queries, one-glance SQL audit, trivial navigation 'all SQL is in db.ts'). The earlier 'split at 300 lines' advice was human-idiomatic working-memory advice; for LLM agents the honest threshold is ~600-800 lines (where structural read summaries start eliding too much). db.ts now has section banners (Users / Sessions / Password resets / Uploads) matching auth.ts style, and AGENTS.md records the single-file rule + reconsideration threshold.
*Relevance: high*

*Context: Deciding db.ts split after tus restructure*

*Tags: elysia-inertia-boilerplate db architecture agents*
---
*Observed: 2026-08-04T03:17:10.742Z*