---
type: source
title: "Disable SSR for authenticated routes to save resources"
slug: disable-ssr-for-authenticated-routes
status: insight
created: 2026-08-07
updated: 2026-08-07
category: architecture
---
# Disable SSR for authenticated routes to save resources
SSR provides zero value for authenticated (login-required) routes: there is no SEO benefit (pages are behind an auth wall, not crawlable), no first-paint benefit for logged-in users (the client hydrates and replaces server-rendered HTML anyway), and the server spends CPU/memory rendering HTML that is immediately discarded. Disabling SSR for authenticated paths reduces server resource usage with no downside.

**Implementation note:** In the Inertia v3 adapter, authenticated routes should return a client-only render (no SSR) — e.g. skip the SSR render step and return the Inertia payload as a plain JSON/HTML document for client-side mounting. Public routes (login, register, landing) keep SSR for SEO and first-paint.

See [[sources/obs-2026-08-03-inertia-v3-in-process-ssr-adapter-for-elysia]] for the SSR adapter implementation and [[concepts/in-process-ssr]] for the SSR concept.
*Category: architecture*
---
*Captured: 2026-08-07*
## Related
_Add links to related pages._