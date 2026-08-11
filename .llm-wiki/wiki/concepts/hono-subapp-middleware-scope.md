---
type: concept
created: 2026-08-10
verified: dulak + kilat (keduanya kena bug ini)
---

# Hono sub-app middleware scope (app.route("/", subApp))

`app.route("/", subApp)` menjalankan `app.use()` middleware dari sub-app untuk
**SEMUA path** di bawah mount point — bukan hanya route yang terdaftar di
sub-app itu. Kalau sub-app tidak punya route yang match, request tetap
diteruskan ke app berikutnya, tapi middleware-nya sudah sempat jalan.

## Bug yang ditimbulkan (verified 2026-08-10)

Rate limiter "auth" yang dipasang di `auth.routes.ts` (sub-app di-mount di
"/") ikut menghitung **semua request** — `/`, `/dashboard`, `/profile`, dll —
dengan bucket dan max yang sama (30/60s). Efek: user yang browsing 30 halaman
dalam semenit kena 429 di seluruh situs.

Test: 60× GET / → 30× 302 + 30× 429 (padahal harusnya semua 302).

## Fix

Tambah filter path di limiter (opsi `paths?: string[]`):

```ts
app.use(rateLimit({
  max: config.rateLimit.authMax,
  windowSeconds: config.rateLimit.authWindow,
  scope: "auth",          // kilat (KV) — dulak tanpa scope
  paths: ["/login", "/register", "/forgot-password", "/reset-password", "/logout"],
}));
```

Di middleware, cek pathname dulu:
```ts
if (opts.paths) {
  const pathname = new URL(c.req.url).pathname;
  if (!opts.paths.includes(pathname)) return next();
}
```

## Pengecekan cepat

- 60× GET / → semua 200/302 (bukan 429)
- 40× POST /login → 30× 4xx biasa + 10× 429 (brute-force tetap keblokir)

## Links
- `rate-limit.ts` (dulak & kilat) — implementasi + komentar
- `analyses/security-audit-2026-08-10.md` — konteks audit
