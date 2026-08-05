---
type: source
title: "Elysia 1.4 hook/plugin quirks"
slug: elysia-14-hook-order-and-plugin-quirks
status: insight
created: 2026-08-03
updated: 2026-08-03
category: architecture
---
# Elysia 1.4 hook/plugin quirks
Findings while building the [[entities/elysia-inertia-boilerplate]] starter on Elysia 1.4.29:

1. **Hooks are positional.** A global `onError` registered AFTER routes never fires for those routes (validation errors returned Elysia's default 422). Register error/global hooks before the routes they cover.
2. **Plugins without routes drop their hooks.** `derive` and `onBeforeHandle` on a named plugin that carries no routes are silently discarded when `.use()`d; `.state()` declarations still flow. Workaround: declare state in the plugin, register population hooks on the route-bearing instances (see `makePopulateStore` in src/server/inertia-plugin.ts).
3. **`derive` types do not flow through `.use()`** (state/decorate do) — handlers could not see plugin-derived props.
4. **TypeBox `error:` keyword is ignored** in `ValidationError.all` messages — friendly per-field messages live in a `VALIDATION_MESSAGES` map keyed by TypeBox path (src/server/routes/auth.routes.ts).
5. **elysia-rate-limit@5 requires Elysia >= 2.0.0** (calls `plugin.beforeHandle`, an internal API missing in 1.4) — hand-rolled a 60-line in-memory fixed-window limiter instead (src/server/rate-limit.ts). Do not downgrade Elysia for a plugin; the limiter is trivial.
*Category: architecture*
---
*Captured: 2026-08-03*
## Related
_Add links to related pages._