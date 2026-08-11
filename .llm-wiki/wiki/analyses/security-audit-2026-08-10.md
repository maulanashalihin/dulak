---
type: analysis
created: 2026-08-10
scope: dulak + kilat
method: static review + dynamic test (local instances, curl)
---

# Security audit — dulak & kilat (2026-08-10)

Audit hasil permintaan user (godmode → disesuaikan: kedua app tidak punya
permukaan LLM, jadi audit web app standard). Test dinamis di instance lokal
(dulak: PORT=4100 bun run dev; kilat: wrangler dev --port 8787 --local).

## Hasil tes dinamis (keduanya)

| Tes | dulak | kilat |
| --- | --- | --- |
| CSRF origin silang (Origin: evil) | 403 ✅ | 403 ✅ |
| CSRF tanpa Origin (non-browser) | lolos (by design) | lolos (by design) |
| Cookie session | HttpOnly + SameSite=Lax (+Secure prod) | sama |
| Session fixation (login 2×) | token beda ✅ | token beda ✅ |
| SQLi (parameterized) | aman ✅ | aman ✅ |
| Stored XSS `</script><script>` breakout | inert ✅ (`\/`-escape + React) | inert ✅ |
| Security headers | CSP lengkap, XFO DENY, nosniff, referrer-policy | sama |
| Rate limit auth (30-40× login) | 429 muncul ✅ | **0× 429 — NO-OP** 🔴 |

## Temuan utama

### 🔴 kilat: rate limiter = no-op stub
`src/server/rate-limit.ts` + `app.ts` (`max: 0, windowSeconds: 0`) dan
`auth.routes.ts` sama. Stateless Workers — butuh KV/DO untuk real limiting.
Dampak: brute-force login/register/forgot-password tanpa batas, tanpa baseline
DDoS. Verified: 40× POST /login → semua 422, tidak ada 429.
Fix cepat (tanpa code): Cloudflare WAF rate limiting rules di depan Worker.
Fix proper: KV counter (per-IP, sliding window) atau Durable Object.

### 🟡 kilat: PBKDF2 100K iterasi
Di bawah rekomendasi OWASP (600K untuk PBKDF2-SHA256). Constraint Workers
(dicatat di code). Kompensasi: edge rate limiting + password policy kuat.

### 🟡 dulak: GET /uploads/:id tanpa auth
File upload bisa di-fetch siapa saja yang tahu id-nya (128-bit random —
praktis unguessable). By design untuk avatar; perlu diingat kalau app
di-extend ke file privat.

### Catatan kecil (keduanya)
- Register membocorkan email sudah terdaftar (user enumeration — tradeoff UX umum)
- Reset token di URL (referrer-policy strict-origin-when-cross-origin memitigasi)
- dulak: content-type upload client-declared (dim mitigasi CSP script-src 'none' di /uploads + nosniff)

## Yang solid (keduanya)
- argon2id (dulak) / PBKDF2 timing-safe (kilat); session token 256-bit
  random, SHA-256 at rest, rotasi login; TTL 30 hari
- CSRF origin check + SameSite=Lax; CSP `frame-ancestors 'none'`, `base-uri`,
  `form-action`; per-path `script-src 'none'` di /uploads (dulak)
- tus: ownership check, offset reconciliation, checksum, size limit,
  traversal guard (regex `[A-Za-z0-9_-]{1,64}`), avatar raster-only
- Inertia JSON `replace(/\//g, "\\/")` — mencegah `</script>` breakout
  (verified dengan payload nyata)

## Fix terpasang (2026-08-10, setelah audit)

1. **kilat: rate limiter KV** — no-op stub diganti fixed-window limiter berbasis
   KV (`RATE_LIMIT_KV` binding, wrangler.toml + README di-update). Global
   200/60s + auth 30/60s. Verified: 210× GET → 200+10, 40× login → 30+10.
   Trade-off: KV eventual consistency (get→put non-atomic) — DO untuk strict.
2. **BOTH: bug sub-app middleware** — limiter auth di sub-app yang di-mount
   di "/" ikut menghitung semua path (30 halaman/menit → 429 site-wide).
   Fix: opsi `paths` di rateLimit. Verified setelah fix: 60× GET / semua
   lolos, login tetap 30+10. Detail: concepts/hono-subapp-middleware-scope.md
3. **kilat: unit test rate limiter** — tests/rate-limit.test.ts (6 test:
   batas max, rollover window, scope/IP separation, fail-open, filter path).
   Total suite kilat 31 test, dulak 63 test — semua pass.
