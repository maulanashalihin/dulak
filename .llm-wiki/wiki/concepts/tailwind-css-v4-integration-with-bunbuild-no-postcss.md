# Tailwind CSS v4 integration with Bun.build (no PostCSS)

Tailwind v4 dapat diintegrasikan ke boilerplate Dulak (Elysia + Bun + Inertia) **tanpa PostCSS sama sekali**, hanya dengan `@tailwindcss/cli`. Pendekatan ini terverifikasi working: utility classes ter-generate, dark mode auto-switch via `[data-theme]`, dan build pipeline tetap menghasilkan content-hashed CSS.

## Prasyarat

- Bun >= 1.3
- Build pipeline: `src/server/assets.ts` → `Bun.build()` → `dist/assets/*` + `manifest.json`
- CSS variables sudah ada di `src/client/styles.css` (`--primary`, `--muted`, `--danger`, dll.)
- Dark mode via `[data-theme="dark"]` di `<html>`

## Langkah instalasi

### 1. Install package
```sh
bun add -D tailwindcss @tailwindcss/cli
```

### 2. Buat `src/client/tailwind.css` (input file)
```css
@import "tailwindcss";

/* Map dark mode to [data-theme="dark"] (boilerplate convention). */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* Bridge existing CSS variables to Tailwind theme tokens. */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-soft: var(--primary-soft);
  --color-danger: var(--danger);
  --color-success: var(--success);
  --radius: var(--radius);
}
```

### 3. Modifikasi `buildClientAssets()` di `src/server/assets.ts`
Tambahkan Tailwind CLI step sebelum `Bun.build`:
```ts
export async function buildClientAssets(): Promise<void> {
  // 1. Compile Tailwind v4 → src/client/.tailwind.css (no PostCSS needed).
  await Bun.$`bunx @tailwindcss/cli -i src/client/tailwind.css -o src/client/.tailwind.css --minify`.quiet()
  const result = await Bun.build({
    entrypoints: ['src/client/app.tsx'],
    // ... existing config
  })
  // ...
}
```

### 4. Import `.tailwind.css` di `src/client/app.tsx`
```ts
import "./.tailwind.css";  // Tailwind output (preflight + utilities)
import "./styles.css";     // custom CSS (overrides Tailwind via cascade)
```
Import `.tailwind.css` **sebelum** `styles.css` supaya custom CSS boilerplate menang saat specificity sama.

### 5. Tambah `src/client/.tailwind.css` ke `.gitignore`
```
src/client/.tailwind.css
```

### 6. Tambah dev scripts ke `package.json`
```json
"dev:css": "bunx @tailwindcss/cli -i src/client/tailwind.css -o src/client/.tailwind.css --watch",
"dev:all": "bunx @tailwindcss/cli -i src/client/tailwind.css -o src/client/.tailwind.css --watch & bun --watch src/index.ts"
```
Dev workflow: jalankan `bun run dev:css` di terminal terpisah, atau `bun run dev:all` untuk sekali command.

## Kenapa tidak butuh PostCSS?

Bun.build **tidak memproses** `@import "tailwindcss"` — dia treat sebagai CSS file import resolution (cari file), bukan PostCSS directive. Jadi `postcss.config.mjs` + `@tailwindcss/postcss` approach (yang dipakai Vite/Next.js) tidak work di Bun.build.

Solusinya: `@tailwindcss/cli` compile Tailwind ke CSS file statis (`.tailwind.css`), lalu Bun.build bundle file itu seperti CSS biasa. No PostCSS runtime needed.

## Temuan penting

### 1. Cascade layers: custom CSS override Tailwind utilities
Tailwind v4 pakai `@layer utilities` untuk utility classes. Custom CSS boilerplate (`.auth-sub`, `.btn`, `.panel`) tidak di layer manapun = unlayered = **menang** atas Tailwind utilities dengan specificity sama.

Contoh: `.auth-sub { color: var(--muted) }` akan override `text-primary` utility pada element yang sama. Ini **expected** dan bagus untuk migrasi bertahap — existing styles tetap working.

### 2. `@theme inline` = runtime CSS variable resolution
Dengan `@theme inline { --color-primary: var(--primary) }`, utility `text-primary` compile ke `color: var(--primary)`. Karena `var()` di-evaluate runtime, dark mode auto-switch tanpa duplikasi nilai.

### 3. `@custom-variant dark` = map ke `[data-theme]`
Default Tailwind v4 dark mode pakai `prefers-color-scheme`. Override dengan:
```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```
Hasil: `dark:text-danger` → `dark\:text-danger:where([data-theme=dark],[data-theme=dark] *) { color: var(--danger) }`.

### 4. Content detection otomatis
Tailwind v4 CLI otomatis scan source files untuk class names. Tidak perlu `content: [...]` config seperti v3. Tapi: class yang hanya di-inject via JavaScript runtime (tidak ada di source file) **tidak akan ter-generate**.

## Verifikasi (2026-08-04)

| Test | Light | Dark | Status |
|---|---|---|---|
| `text-primary` | `#059669` | `#10b981` | ✅ Auto-switch via var() |
| `dark:text-danger` | `#059669` (primary) | `#dc2626` (danger) | ✅ Dark variant works |
| `[data-theme="dark"]` selector | — | match | ✅ Custom variant |
| Tailwind banner in CSS | present | — | ✅ |
| Build pipeline | CLI → Bun.build → manifest | — | ✅ |

## Arsitektur setelah integrasi

```
src/client/tailwind.css  (input: @import, @theme, @custom-variant)
         ↓
    @tailwindcss/cli  →  src/client/.tailwind.css  (compiled, gitignored)
         ↓
    app.tsx imports .tailwind.css + styles.css
         ↓
    Bun.build()  →  dist/assets/app-[hash].css
         ↓
    manifest.json  →  server serve /assets/*
```