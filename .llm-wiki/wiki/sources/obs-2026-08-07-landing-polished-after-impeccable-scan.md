---
type: source
title: "Observation: Dulak landing polished after impeccable scan — all actionable findings fixed"
slug: obs-2026-08-07-landing-polished-after-impeccable-scan
status: observation
created: 2026-08-07
updated: 2026-08-07
relevance: high
observed_at: 2026-08-07T16:35:00.000Z
tags: ["dulak", "site", "impeccable", "design", "ai-slop"]
source_context: "Fix landing dulak.pages.dev berdasarkan findings detector impeccable"
---
# ⭐ Observation: Dulak landing polished after impeccable scan — all actionable findings fixed

Fix 7 file landing site (site/src/components/*.astro + styles/landing.css) berdasarkan findings valid detector impeccable (lihat [[obs-2026-08-07-impeccable-detector-on-dulak-landing]]).

## Perubahan
1. **gradient-text (12→0)**: `.dl-gradient` → `.dl-accent` solid `#34d399` di 5 heading (boring, Boringly, nothing invented, Three clients, real hardware) + `.dl-bench-value` + `.dl-stat-value` (angka statistik) solid. Definisi `.dl-gradient` mati di landing.css dihapus.
2. **icon-tile-stack (6→0)**: FeatureGrid — icon 40×40 tile di atas h3 → `.dl-feature-head` flex row (icon inline kiri + h3 sejajar, gap 0.7rem).
3. **low-contrast (2→0)**: `.dl-btn-primary` gradient #10b981→#059669 (2.5:1) → solid `#047857` (5.5:1) di Hero + CtaBanner. `#6b7685` (4.1:1) → `#8b95a5` (6.25:1) ×4 di BenchPreview.
4. **undersized-ui-text (2→0)**: `.dl-bench-th-unit` 0.65rem (10.4px) → 0.72rem (11.5px).
5. **cramped-padding (1→0)**: `.dl-bench-table-wrap` + padding 0.4rem inset.

## Verifikasi
- Static scan dist: 0 findings (sebelum juga 0).
- URL scan versi baru (astro preview lokal): 381 → 345. Sisa 345 = `ai-color-palette` x334 (false positive palet emerald-on-dark, verified visual nol ungu) + deliberate (dark-glow brand, blinking-cursor terminal, em-dash copy) + line-length x6 (debatable).
- Screenshot + vision: heading solid emerald, icon inline sejajar judul, layout utuh.

## Catatan
- Bug skrip fix pertama: replace `dl-gradient` → `dl-accent` sebelum regex → regex nyari nama lama. Urutan benar: regex dulu atau regex nyari nama baru.
- `.dl-gradient` BenchPreview aslinya `color: transparent` beda format → replace global `#6b7685→#8b95a5` kena. Manual fix.

*Relevance: high*

*Context: Fix landing dulak.pages.dev berdasarkan findings detector impeccable*

*Tags: dulak site impeccable design ai-slop*
---
*Observed: 2026-08-07T16:35:00.000Z*
