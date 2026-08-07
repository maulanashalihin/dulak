---
type: concept
created: 2026-08-07
updated: 2026-08-07
---

# UI anti-patterns (AI tells)

Signals that make an interface look AI-generated instead of designed. Consensus across the anti-AI-slop field (Impeccable, Hallmark, UI UX Pro Max). Check for these before handing back any UI work; fix them proactively, don't wait for review.

## Color & surface

- **AI beige** — the default warm off-white / cream background every LLM reaches for (`#FAFAF8`, `#FDFBF7`…). Pick a deliberate background that fits the brand, or commit to a real tint.
- **AI purple/pink gradients** — the default `#7C3AED → #EC4899` hero gradient. Reached for in every generated landing page.
- **Default blue CTA** — unmodified Tailwind/utility `blue-600` button as the only accent.
- **Ghost cards** — white cards on gray background with nothing inside them but a border and padding. Every card should earn its existence.

## Shape & depth

- **Over-rounding** — border-radius `12–16px+` on everything (buttons, inputs, cards, badges). Round only what needs rounding; 4–8px is usually enough for dense UI.
- **Everything equal** — every card, tile, and metric identical size/weight. Dashboards get "status-chip soup": a row of equal chips with equal importance. Introduce hierarchy — one thing is the hero, the rest support it.
- **Flat on flat** — no elevation system; cards defined only by a 1px border, or only by shadow, never both deliberately. Pick one elevation language and stick to it.

## Type

- **Italic serif accent** — a single italic serif word ("*Discover*", "*Elevate*") as the hero decoration. The single most common AI tell in headlines.
- **Inter + a display serif, always** — the default pairing. If the project has no font system, pick deliberately; if it has one, use it.
- **Everything same size** — no type scale: all text 16px, no hierarchy between h1/h2/body/label.

## Motion & interaction

- **Pulsing dot** — a pulsing green/orange dot to signal "live". Check if it's actually needed.
- **Image-on-hover motion** — every card zooms its image on hover (default template behavior). Reserve motion for what matters.
- **Generic hover states** — hover does nothing meaningful, or does the same opacity shift everywhere.
- **Missing states** — no `:focus-visible`, no `:hover`, no `prefers-reduced-motion` handling, no disabled styles.

## Layout & content

- **Side-tab / default sidebar** — the default admin layout: left sidebar, top bar, content. Only use when the app actually needs persistent navigation.
- **Hero → 3 features → CTA → footer** — the default landing rhythm (see [[ui-design-principles]] — structural variety).
- **Generic copy** — "Unlock your potential", "Boost your productivity", "Seamless experience". Write copy like a human who knows the product.
- **Too many form fields** — every field required, no grouping, no progressive disclosure.
- **Emoji as icons** — emoji replacing real SVG icons (Heroicons/Lucide). Use an icon set.

## References

- Impeccable (pbakaus) — 59 deterministic detector rules, `npx impeccable detect`
- Hallmark (Nutlope) — anti-patterns.md, slop-test.md (57 gates)
- UI UX Pro Max (nextlevelbuilder) — ui-reasoning.csv, pre-delivery checklist

## Related

- [[ui-design-principles]]
