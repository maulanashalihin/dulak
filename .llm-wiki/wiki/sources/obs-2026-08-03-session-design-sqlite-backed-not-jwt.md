---
type: source
title: "Observation: Session design: SQLite-backed, not JWT"
slug: obs-2026-08-03-session-design-sqlite-backed-not-jwt
status: observation
created: 2026-08-03
updated: 2026-08-03
relevance: high
observed_at: 2026-08-03T09:06:59.549Z
tags: ["auth", "session", "database", "security"]
source_context: "Building auth for elysia-inertia-boilerplate"
---
# ⭐ Observation: Session design: SQLite-backed, not JWT
Boilerplate auth uses DB-backed sessions: 256-bit random token in the `sessions` table (token, user_id, flash JSON, expires_at, 30-day TTL), cookie only holds the token (httpOnly, SameSite=Lax, Secure in prod). Logout deletes the row server-side — instant revocation. Password hashing: argon2id via Bun.password (memoryCost 19456, timeCost 2). `passwordHash` is stripped from every outgoing payload via toPublicUser (verified: no leak in page props). Files: src/server/auth.ts, src/server/db.ts. Tests: tests/app.test.ts.
*Relevance: high*

*Context: Building auth for elysia-inertia-boilerplate*

*Tags: auth session database security*
---
*Observed: 2026-08-03T09:06:59.549Z*