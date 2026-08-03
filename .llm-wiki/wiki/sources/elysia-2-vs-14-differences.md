---
type: source
title: "Elysia 2.0 (DayDream) vs 1.4 differences"
slug: elysia-2-vs-14-differences
status: insight
created: 2026-08-03
updated: 2026-08-03
category: architecture
---
# Elysia 2.0 (DayDream) vs 1.4 differences
Riset dari blog resmi (elysiajs.com/blog/elysia-20) + migration PR #1873. Elysia 2.0 = **rewrite total** dari nol (nama: DayDream), masih **beta** (`elysia@next`, 2.0.0-beta.1; `latest` tetap 1.4.29).

**Tujuan 2.0:** bukan throughput (hampir sama), tapi memory, startup time, bundle size: bundle turun >50% (736KB→344KB tanpa TypeBox, tree-shakeable), startup +30%, memory 32KB/route→2.3KB/route, **AOT compilation** (build plugin `elysia/plugin/aot/<bundler>` untuk Bun.build/vite/esbuild/rspack), Adapter v2 publik (Node via srvx), `defer()` callback post-response.

**Breaking changes utama:** (1) route parameter swap — `post('/', {schema}, handler)` schema dulu; (2) hook `on` prefix dihapus: onBeforeHandle→beforeHandle, onError→error, onRequest→request, dst.; (3) error handling total: `code` dihapus → `error(ErrorClass, fn)` + fallback `error(({error}) => ...)`; (4) **RFC 9457 Problem Details** — semua error jadi `application/problem+json`, bukan bare string; (5) `resolve` dihapus → `derive` (sekarang jalan di beforeHandle); (6) macro `.macro(name, def)` dihapus → objek form; (7) scope: `{as:'scoped'}` → `'plugin'` string; guard/group default jadi override (butuh `schema:'standalone'`); (8) WebSocket opt-in (`elysia/websocket`, generator/yield); (9) TypeBox 0.x → 1.0; (10) `aot:false` dihapus; file-type di-unbundle (butuh setFileTypeDetector). Keamanan: error 500 tidak bocor message di production; signed-cookie constant-time.

**Kaitannya dengan boilerplate ini (1.4.29):** semua route kita `post('/', handler, {body})` kena route-parameter-swap; semua hook onBeforeHandle/onError kena rename; onError VALIDATION branch kena error-handling overhaul; validation response 422 custom kita tetap OK (kita bangun payloadnya sendiri). elysia-rate-limit@5 butuh elysia>=2.0 (pakai internal plugin.beforeHandle) — konsisten dengan plugin system baru @elysia scope. Codemod `bunx @elysia/codemod` mengotomasi ~95%.

**Rekomendasi:** tetap 1.4.29 (stable) untuk boilerplate; upgrade ke 2.0 saat stable rilis (beta label dipertahankan sampai plugin mayoritas migrate). Lihat [[entities/elysia]] dan [[sources/elysia-14-hook-order-and-plugin-quirks]].
*Category: architecture*
---
*Captured: 2026-08-03*
## Related
_Add links to related pages._