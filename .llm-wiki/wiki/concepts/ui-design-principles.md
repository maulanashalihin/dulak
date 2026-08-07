---
type: concept
created: 2026-08-07
updated: 2026-08-07
---

# UI design principles

How to approach UI work in this repo so the result looks designed, not generated. Read [[ui-anti-patterns]] alongside this — the principles say what to do, the anti-patterns say what to avoid.

## 1. Design system first

Before editing or creating UI, read the incumbent visual truth:

- `src/client/styles.css` — design tokens (`:root` variables: colors, spacing, font sizes), reset, shared primitives (`.btn`, `.badge`, `.panel`, `.table`, `.avatar`)
- `src/client/components/` — existing components (Layout, AuthLayout, Field, Brand) and their co-located `.css`
- Sibling `.css` files of the page being changed

**New work fits the system — it never invents a parallel one.** If a token exists, use it. If a component exists, compose it. Only add tokens/components when nothing existing covers the need, and add them in the established pattern (tokens to `styles.css`, component styles to the component's sibling `.css`).

## 2. Structural variety

Two pages for two different jobs should not share the same rhythm. The default LLM landing pattern — hero → 3 features → CTA → footer — is a template, not a design. Before building, ask what the page is *for* and pick a structure that serves it:

- Landing page → persuade: one sharp idea, made unmissable
- Dashboard → operate: complete a task with least friction
- Docs/reference → read: build understanding with a clear argument
- Experience → let the work lead

Variation in structure matters more than variation in color. Two pages should feel like different sites, not recolors of the same one.

## 3. Hierarchy over equality

Every section has one thing that matters most; the rest supports it. This applies to:

- **Type**: one scale with clear h1/h2/body/label steps, not all-16px
- **Cards/tiles**: not every card equal weight — hero metric vs supporting stats
- **CTAs**: one primary action per view, not three equal buttons
- **Layout**: deliberate whitespace; density where the job needs it

## 4. Mode before decoration

Know what the surface is for before choosing aesthetics:

- **Persuade** (landing) — attention, a sharp idea, proof
- **Operate** (app) — clarity, speed, calm; decoration serves the task
- **Read** (docs/forms) — legibility, structure, a clear argument

A dashboard should help someone work; a landing page should win attention. If the design choice would slow down the job, it's wrong for that surface.

## 5. Pre-delivery checklist

Before declaring UI done, verify:

- [ ] No [[ui-anti-patterns|AI tells]] (beige, ghost cards, italic serif accent, pulsing dot…)
- [ ] Text contrast ≥ 4.5:1 (WCAG AA) in light mode
- [ ] `:focus-visible` states visible for keyboard nav
- [ ] `prefers-reduced-motion` respected (no motion, or minimal)
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover states with smooth transitions (~150–300ms)
- [ ] No emoji as icons — use an SVG icon set
- [ ] Inertia flash/loading states handled (see [[one-shot-flash-messages]])

## Related

- [[ui-anti-patterns]]
- [[in-process-ssr]] — how pages render (SSR + hydration)
- [[partial-reloads]] — Inertia navigation behavior
