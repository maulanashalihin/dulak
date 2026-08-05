---
type: source
title: "Observation: Tailwind templates converted to utility classes + Dulak rebrand"
slug: obs-2026-08-05-tailwind-templates-converted-to-utility-classes-dulak-rebran
status: observation
created: 2026-08-05
updated: 2026-08-05
relevance: high
observed_at: 2026-08-05T10:23:01.477Z
tags: ["styling", "tailwind", "agents-md", "branding", "dulak"]
---
# ⭐ Observation: Tailwind templates converted to utility classes + Dulak rebrand
Root cause of AI agents writing CSS in styles.css on tailwind branches: AGENTS.md was identical across main and tailwind branches, still saying 'Vanilla CSS — no CSS framework'. The tailwind branches only added tooling (tailwind.css, @tailwindcss/cli) but never converted components or updated context files. Fix applied to template/react-tailwind: (1) trimmed styles.css from 1220 lines to tokens+keyframes only, (2) updated tailwind.css with @theme inline + @layer base, (3) converted all 4 components + 8 pages to Tailwind utility classes, (4) updated AGENTS.md Style section to explicitly say 'Styling is done with Tailwind utility classes — do NOT write component CSS in styles.css', (5) updated README Styling section. Verified: typecheck pass, build pass, 62 tests pass, visual smoke test in browser confirmed login/register/dashboard render correctly in dark mode. Separately, rebranded 'Hono Inertia' → 'Dulak' across all 4 branches (main, react-tailwind, svelte-tailwind, vue-tailwind) — 7 files per branch (Brand, app, ssr, inertia.ts, index.ts, Layout, styles.css comment).
*Relevance: high*

*Tags: styling tailwind agents-md branding dulak*
---
*Observed: 2026-08-05T10:23:01.477Z*