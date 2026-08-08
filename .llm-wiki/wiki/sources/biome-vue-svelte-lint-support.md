---
type: source
title: "Biome lints Vue SFCs natively, Svelte only partially"
slug: biome-vue-svelte-lint-support
status: insight
created: 2026-08-07
updated: 2026-08-07
category: tooling
---
# Biome lints Vue SFCs natively, Svelte only partially
Tested Biome 2.5.7 lint support for framework SFCs:

**Vue (.vue) — full support.** Biome parses `<script setup lang="ts">` correctly. `noExplicitAny`, `noUnusedVariables`, `noUnusedImports`, and `useVueMultiWordComponentNames` all fire inside `.vue` files. The `!**/*.vue` exclude in biome.json is unnecessary and was removed from both Vue branches.

**Svelte (.svelte) — partial support, false positives.** Biome parses `.svelte` files but does NOT fully understand Svelte syntax:
- `noExplicitAny` does NOT fire for `const x: any = 1` inside `<script lang="ts">` (catches import-level issues but not deep variable declarations)
- `noAssignInExpressions` fires as an ERROR on Svelte reactive assignments (`$:` syntax) — this is valid Svelte, not a real issue
- `noUnusedVariables` does fire (useful but noisy given the false positives)

Conclusion: keep `!**/*.svelte` exclude in biome.json for Svelte branches. Biome's Svelte support is incomplete and produces false positives on framework-specific syntax. Use `svelte-check` for Svelte linting instead.

See [[sources/obs-2026-08-04-agents-md-created-codifying-repo-architecture]] for AGENTS.md lint guidance.
*Category: tooling*
---
*Captured: 2026-08-07*
## Related
_Add links to related pages._