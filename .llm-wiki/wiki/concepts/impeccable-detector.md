---
type: concept
title: "Impeccable detector: cara pakai, pitfall, dan akurasi"
slug: impeccable-detector
status: stable
created: 2026-08-07
updated: 2026-08-07
relevance: high
tags: ["impeccable", "design", "detector", "ai-slop", "tooling", "ci"]
---
# Impeccable detector — cara pakai, pitfall, dan akurasi

Detector UI anti-pattern dari [impeccable.style](https://impeccable.style) (npm `impeccable`, Apache-2.0, Paul Bakaus). 59+ rules, kategori `slop` (AI tell) + `quality` (aksesibilitas/typografi). Ada juga SKILL.md (prompt-based review) + hooks + Chrome ext — detector CLI adalah bagian deterministic-nya.

## Install & jalankan
```bash
# global kena permission di server → install lokal
mkdir -p ~/tools/impeccable && cd ~/tools/impeccable && npm i impeccable

# static scan (HTML + linked CSS)
./node_modules/.bin/impeccable detect <file-or-dir> [--json]

# URL scan (Puppeteer full render) — butuh puppeteer + Chrome yang ada
PUPPETEER_SKIP_DOWNLOAD=true npm i puppeteer   # reuse Chrome Playwright
CI=true PUPPETEER_EXECUTABLE_PATH=$HOME/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome \
  ./node_modules/.bin/impeccable detect https://example.com [--json]
```

## Pitfall (verified 2026-08-07)
1. **URL scan butuh `CI=true`** — impeccable cuma nambah `--no-sandbox` kalau `process.env.CI` set (detect-url.mjs line 207). Tanpa itu, Chrome gagal launch di server (sandbox error, sama kayak browser_navigate).
2. **False positive massal untuk palet emerald-on-dark** — landing dulak (palet emerald/teal murni, verified visual nol ungu) kena 347× `ai-color-palette` (319× "purple/violet neon", 15× "cyan neon", 13× "cyan gradient"). Classifier hue salah label: emerald terang #34d399 dibaca "cyan". **Jangan auto-block CI pakai mode URL** — cross-check visual/manual dulu. Mode static (dist HTML) akurat: 0 findings untuk site yang sama.
3. **`line` selalu 0 di mode URL** — findings gak punya selector/line number, cuma `snippet` deskriptif. Identifikasi elemen manual via grep source.
4. `overused-font` bisa false-positive untuk system-ui stack (resolve ke Roboto di Linux, padahal bukan pilihan literal).

## Yang akurat & actionable
- `gradient-text` (background-clip:text) — akurat, tiap kemunculan.
- `icon-tile-stack` (icon tile persegi di atas heading) — akurat.
- `low-contrast` — akurat, kasih rasio + hex lengkap.
- `undersized-ui-text` — akurat, kasih ukuran px + elemen.
- `em-dash-overuse`, `line-length`, `cramped-padding` — akurat tapi severity rendah.

## Workflow rekomendasi
1. `impeccable detect dist/index.html --json` dulu (static, nol false positive).
2. Kalau mau, URL scan `--json` utk computed-style rules — tapi selalu filter manual rule `ai-color-palette` utk palet hijau/teal (false positive tinggi).
3. Findings valid → cocokkan ke `.llm-wiki/wiki/concepts/ui-anti-patterns.md`.

*Relevance: high*

*Context: Analisa landing dulak.pages.dev pakai impeccable@3.5.0 detector*
