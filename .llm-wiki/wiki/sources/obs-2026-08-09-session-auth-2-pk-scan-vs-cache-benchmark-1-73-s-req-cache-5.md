---
type: source
title: "Observation: Session auth 2 PK scan vs cache benchmark — 1.73µs/req, cache 5x faster but stale-risk"
slug: obs-2026-08-09-session-auth-2-pk-scan-vs-cache-benchmark-1-73-s-req-cache-5
status: observation
created: 2026-08-09
updated: 2026-08-09
relevance: medium
observed_at: 2026-08-09T02:38:45.338Z
tags: ["auth", "session", "benchmark", "performance", "sqlite", "cache"]
source_context: "Researching session vs JWT cost comparison for blog post why-sessions-not-jwt.mdx"
---
# 🔍 Observation: Session auth 2 PK scan vs cache benchmark — 1.73µs/req, cache 5x faster but stale-risk
Benchmarked resolveUser() path (hashToken + findSession + findUserById) on bun:sqlite WAL, 100K users+sessions. No-cache: 1.73µs/req (578K ops/sec). Full cache (token->UserRow in Map): 0.35µs/req (2.87M ops/sec, 5x faster). Session cache (token->SessionRow in Map + 1 PK user fetch): 0.95µs/req (1.05M ops/sec, 1.8x faster). Cost breakdown: hashToken SHA-256 = 0.31µs (18%), 2 PK scans = 1.42µs (82%). Scaling 10K->100K rows: only +0.09µs (5.5%) — B-tree O(log n) essentially constant. Memory: ~120 bytes/entry full cache, ~80 bytes/entry session cache. Key tradeoff: full cache re-invents JWT stale-payload problem (role/ban/email changes don't propagate without invalidation = same complexity as JWT revocation list). Session cache is safe middle ground (user data always fresh) but only 1.8x. Conclusion: at 1.73µs/req, auth lookup is not the bottleneck — cache complexity not justified for Dulak's single-process scale. Blog claims 52K reads/sec; benchmark shows 578K ops/sec for full resolveUser path (blog number likely includes HTTP overhead).
*Relevance: medium*

*Context: Researching session vs JWT cost comparison for blog post why-sessions-not-jwt.mdx*

*Tags: auth session benchmark performance sqlite cache*
---
*Observed: 2026-08-09T02:38:45.338Z*