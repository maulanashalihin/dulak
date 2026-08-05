---
type: source
title: "Benchmark: Elysia 1.4.29 vs 2.0.0-beta.1 raw speed"
slug: elysia-14-vs-2-benchmark-raw-speed
status: insight
created: 2026-08-03
updated: 2026-08-03
category: performance
---
# Benchmark: Elysia 1.4.29 vs 2.0.0-beta.1 raw speed
Benchmark murni (scratch di /tmp/elysia-bench, terpisah dari boilerplate): Elysia 1.4.29 vs 2.0.0-beta.1, runtime sama (Bun 1.3.14), route identik, wrk -t4 -c64, 6-core VM berbeban (load ~2). Interleaved rounds, laporan best-of.

**Throughput (req/s):** `/` (plain string): v1 30.6k vs v2 29.5k (-3.6%); `/json` (return objek): v1 26-31k vs v2 12-16k (**-35% s.d. -50%**, konsisten di 2 sesi); `/user/:id` (dinamis): v1 16.8k vs v2 18.7k (+11%); POST `/echo` + validasi TypeBox: v1 16.5k vs v2 18.4k (+12%). AOT v2 di route /: 28.4k (≈ sama, tidak ada keajaiban di rig ini).

**Startup dev-mode (import→listen→request pertama, 3 ronde):** v1 130-273ms / RSS ~61MB; v2 324-462ms / RSS ~81MB. Kontras dengan klaim blog (+30% startup, memory lebih kecil) — kemungkinan klaim blog diukur dengan AOT + hardware khusus; di dev-mode beta ini JIT pertama-request ikut terhitung.

**Kesimpulan:** beta.1 belum layak sebagai pengganti 1.4 di jalur produksi untuk route JSON-heavy; di route plain/dinamis/validasi setara. Gap `/json` patut diwaspadai (kemungkinan mapResponse objek di beta lebih berat). Catatan metodologi: AOT codegen emit bare specifier `elysia` sehingga butuh alias npm; dry-run AOT mengeksekusi entry (guard `Manifest.isCapturing()`). Lihat [[sources/elysia-2-vs-14-differences]] dan [[entities/elysia]].
*Category: performance*
---
*Captured: 2026-08-03*
## Related
_Add links to related pages._