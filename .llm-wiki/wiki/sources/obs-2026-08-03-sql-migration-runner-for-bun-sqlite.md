---
type: source
title: "Observation: SQL migration runner for bun:sqlite"
slug: obs-2026-08-03-sql-migration-runner-for-bun-sqlite
status: observation
created: 2026-08-03
updated: 2026-08-03
relevance: high
observed_at: 2026-08-03T09:06:59.556Z
tags: ["database", "migrations", "sqlite"]
source_context: "Adding migration support to elysia-inertia-boilerplate"
---
# ⭐ Observation: SQL migration runner for bun:sqlite
Zero-dep migration runner at src/server/migrations.ts: SQL files in migrations/ (0001_init.sql, 0002_auth_features.sql) applied in filename order at startup, each inside a transaction, tracked in schema_migrations (never re-applied). ALTER TABLE ADD COLUMN with NOT NULL needs DEFAULT. Never edit an applied migration — add a new numbered file instead. Verified: fresh boot, add-column migration, idempotent reboot (tests in tests/app.test.ts, migrations checked via PRAGMA table_info).
*Relevance: high*

*Context: Adding migration support to elysia-inertia-boilerplate*

*Tags: database migrations sqlite*
---
*Observed: 2026-08-03T09:06:59.556Z*