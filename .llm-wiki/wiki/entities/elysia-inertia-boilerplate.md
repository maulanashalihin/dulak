# elysia-inertia-boilerplate

Full-stack starter boilerplate: **Elysia 1.4.29** (stable; 2.x masih beta) + **bun:sqlite** + **Inertia v3 / React 19**, seluruhnya di atas **Bun 1.3**. Lokasi: `~/projects/elysia-inertia-boilerplate` (dipindah dari /tmp 2026-08-03 karena project ini dimaintain), repo GitHub public `maulanashalihin/elysia-inertia-boilerplate`.

## Stack & fitur
- Auth lengkap: register/login/logout, forgot/reset password, Google OAuth (zero-dep fetch), roles (user/admin), rate limiting auth endpoints
- Inertia v3 dengan SSR in-process (tanpa SSR server terpisah), version negotiation 409, partial reload, flash
- Migrasi SQL versioned (migrations/ + schema_migrations), bun:sqlite tanpa ORM
- Ops: config validated fail-fast, logging + x-request-id, security headers, /health, graceful shutdown, Dockerfile multi-stage
- 20 test bun:test (in-memory DB)

## Keputusan arsitektur kunci
- Session DB-backed (bukan JWT) → logout revoke seketika: [[sources/obs-2026-08-03-session-design-sqlite-backed-not-jwt]]
- Migration runner zero-dep: [[sources/obs-2026-08-03-sql-migration-runner-for-bun-sqlite]]
- SSR in-process + registry eksplisit (Bun 1.3 hapus import.meta.glob): [[sources/obs-2026-08-03-inertia-v3-in-process-ssr-adapter-for-elysia]]
- Gotcha Elysia 1.4 (hook positional, plugin tanpa route drop hooks, elysia-rate-limit butuh 2.x → hand-rolled limiter): [[sources/elysia-14-hook-order-and-plugin-quirks]]

## Sumber
- [[sources/SRC-2026-08-03-001]] — README project