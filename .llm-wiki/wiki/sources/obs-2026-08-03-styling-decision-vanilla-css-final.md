---
type: source
title: "Observation: Styling decision: vanilla CSS, final"
slug: obs-2026-08-03-styling-decision-vanilla-css-final
status: observation
created: 2026-08-03
updated: 2026-08-03
relevance: critical
observed_at: 2026-08-03T09:47:35.667Z
tags: ["styling", "decision", "tailwind", "css"]
source_context: "Final styling decision untuk elysia-inertia-boilerplate"
---
# 🔴 Observation: Styling decision: vanilla CSS, final
Keputusan final (2026-08-03): boilerplate memakai vanilla CSS (src/client/styles.css, tokens + dark mode), TIDAK Tailwind. Rationale: UI boilerplate kecil & sudah jadi — keuntungan Tailwind (utility speed) terbayar di project yang di-fork, bukan di sini; konsisten dengan filosofi zero-dep hand-rolled; opiniasi = biaya untuk fork; reversibel tanpa biaya (upgrade path terukur: +2 dep tailwindcss + @tailwindcss/cli, build 0.2s→0.4s, dev restart +350ms, migrasi stylesheet 1-2 jam, tanpa HMR di kedua opsi). Kondisi pembalik: kalau UI boilerplate sendiri tumbuh kompleks. Sudah terdokumentasi di README section Styling. Jangan tanya ulang — keputusan terkunci.
*Relevance: critical*

*Context: Final styling decision untuk elysia-inertia-boilerplate*

*Tags: styling decision tailwind css*
---
*Observed: 2026-08-03T09:47:35.667Z*