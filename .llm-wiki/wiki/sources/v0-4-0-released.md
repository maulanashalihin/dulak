---
type: source
title: "v0.4.0 released — SSR skip, Biome lint, Windows fix"
slug: v0-4-0-released
status: insight
created: 2026-08-07
updated: 2026-08-07
category: release
---
# v0.4.0 released — SSR skip, Biome lint, Windows fix
Released v0.4.0 on 2026-08-07. Key changes since v0.3.0:

- **perf(ssr)**: skip SSR for authenticated routes (no SEO behind auth wall, client hydrates anyway)
- **tooling**: Biome lint added to all 6 branches + CI lint step. Vue SFCs natively supported; Svelte SFCs excluded (false positives)
- **fix(db)**: Windows `:memory:` mkdir EEXIST guard (PR #2 by @avathurrahman)
- **fix(docker)**: curl installed in runtime stage for healthcheck
- **fix(rate-limit)**: auth default 10 → 30 req/60s
- **a11y**: removed autoFocus from auth pages
- **create-dulak**: arrow-key nav, 2-step installer, several fixes
- **docs**: AGENTS.md Browser testing section, pre-commit hook for undefined wiki slugs, README/site philosophy rewrite

All 6 branches synced and pushed. Tag v0.4.0 on main. GitHub release: https://github.com/maulanashalihin/dulak/releases/tag/v0.4.0
*Category: release*
---
*Captured: 2026-08-07*
## Related
_Add links to related pages._