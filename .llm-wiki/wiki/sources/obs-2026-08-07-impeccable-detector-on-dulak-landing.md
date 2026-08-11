---
type: source
title: "Observation: Impeccable detector scan of dulak.pages.dev — 381 findings, 91% false positive"
slug: obs-2026-08-07-impeccable-detector-on-dulak-landing
status: observation
created: 2026-08-07
updated: 2026-08-07
relevance: high
observed_at: 2026-08-07T16:20:00.000Z
tags: ["dulak", "site", "impeccable", "design", "ai-slop", "detector"]
source_context: "Analisa landing dulak.pages.dev pakai impeccable@3.5.0 detector"
---
# ⭐ Observation: Impeccable detector scan of dulak.pages.dev — 381 findings, 91% false positive

Scan landing page dulak (https://dulak.pages.dev) dengan `impeccable detect` v3.5.0 (npm, Apache-2.0, Paul Bakaus).

## Setup yang dipakai
- Install lokal `~/tools/impeccable` (npm i -g gagal — permission global).
- URL scan butuh puppeteer; download Chrome gagal → `PUPPETEER_SKIP_DOWNLOAD=true` + `PUPPETEER_EXECUTABLE_PATH=~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`.
- Chrome sandbox error di server → `CI=true` env: impeccable cuma nambah `--no-sandbox` kalau `process.env.CI` set (line 207 detect-url.mjs).
- Static scan: `impeccable detect dist/index.html --json` → `[]` (nol temuan).

## Hasil URL scan (full browser render): 381 findings
- `ai-color-palette` x347 — **FALSE POSITIVE MASSAL**. Source CSS landing nol ungu/cyan (semua #059669/#0d9488/#065f46/#34d399 — emerald/teal). Verified visual via screenshot + vision: nol ungu/violet/pink. Detector salah klasifikasi emerald terang (#34d399 mint) sebagai "cyan neon on dark", dan label "purple/violet neon" untuk elemen lain tanpa dasar. 319× "purple/violet neon text" padahal visual bersih.
- `gradient-text` x12 — **TRUE**. 5 heading pakai `.dl-gradient` (background-clip:text): boring, Boringly, nothing invented, Three clients, real hardware. Melanggar rule anti-AI-slop sendiri (ui-anti-patterns.md).
- `icon-tile-stack` x6 — **TRUE**. 6 feature card `.dl-feature-icon` 40x40px tile di atas h3.
- `line-length` x6 — TRUE-ish, ~101 chars (debatable utk dev landing).
- `low-contrast` x2 — **TRUE**. #fff on #10b981 = 2.5:1 (btn "Get started"), #6b7685 on #0d1117 = 4.1:1.
- `undersized-ui-text` x2 — TRUE. 10.4px "req/s" (< 11px floor).
- `em-dash-overuse` — TRUE, 12 em-dash di source (detector hitung 8 body).
- `overused-font` — debatable. system-ui stack resolve ke Roboto di Linux (bukan pilihan literal).
- `blinking-cursor` — deliberate (animasi ketik terminal hero).
- `dark-glow` — deliberate brand (glow #059669 logo/button).
- `cramped-padding` — minor (bench table wrap).
- `gpt-thin-border-wide-shadow` — advisory (1px border + 60px shadow).

## Kesimpulan
1. Mode static (HTML+CSS) bersih = landing gak punya anti-pattern statis.
2. Mode URL (browser) false positive rate tinggi utk palet emerald-on-dark (91%: 347/381) — harus cross-check visual/manual, jangan auto-block CI.
3. Findings valid tetap actionable: gradient-text, icon-tile-stack, low-contrast, undersized text — persis rule anti-AI-slop yang ditulis sendiri di `.llm-wiki`.

*Relevance: high*

*Context: Analisa landing dulak.pages.dev pakai impeccable@3.5.0 detector*

*Tags: dulak site impeccable design ai-slop detector*
---
*Observed: 2026-08-07T16:20:00.000Z*
