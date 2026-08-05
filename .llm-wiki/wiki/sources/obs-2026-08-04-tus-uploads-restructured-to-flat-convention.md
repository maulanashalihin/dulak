---
type: source
title: "Observation: tus uploads restructured to flat convention"
slug: obs-2026-08-04-tus-uploads-restructured-to-flat-convention
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: high
observed_at: 2026-08-04T02:55:40.021Z
tags: ["elysia-inertia-boilerplate", "tus", "testing", "architecture"]
source_context: "Restructuring src/server/tus/ per README convention"
---
# ⭐ Observation: tus uploads restructured to flat convention
tus resumable-upload restructured to repo convention: src/server/routes/tus.routes.ts (handlers inline, matching auth/oauth/pages route files), flat modules tus-protocol.ts + tus-storage.ts, SQL statements merged into db.ts. src/server/tus/ folder deleted. Also found: bun test needs --isolate — test files set env in beforeAll and db.close() in afterAll as if process-isolated, but bun 1.3 runs files in one shared process, so app.test.ts's teardown finalized tus.test.ts's prepared statements ('Statement has finalized'); UPLOAD_DIR config caching (config.ts reads env at import) had the same cross-file issue. Fixed via package.json test script and CI using 'bun test --isolate'. Suite: 46 tests, all passing.
*Relevance: high*

*Context: Restructuring src/server/tus/ per README convention*

*Tags: elysia-inertia-boilerplate tus testing architecture*
---
*Observed: 2026-08-04T02:55:40.021Z*