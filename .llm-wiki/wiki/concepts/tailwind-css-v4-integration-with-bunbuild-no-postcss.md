# Tailwind CSS v4 integration with Bun.build (no PostCSS)

Tailwind v4 can be integrated into the Dulak boilerplate (Elysia + Bun + Inertia) **without any PostCSS**, using only `@tailwindcss/cli`. Verified working: utility classes generate, dark mode auto-switches via `[data-theme]`, and the build pipeline still produces content-hashed CSS.

## Prerequisites

- Bun >= 1.3
- Build pipeline: `src/server/assets.ts` → `Bun.build()` → `dist/assets/*` + `manifest.json`
- CSS variables in `src/client/styles.css` (`--primary`, `--muted`, `--danger`, etc.)
- Dark mode via `[data-theme="dark"]` on `<html>`

## Installation steps

### 1. Install package

```sh
bun add -D tailwindcss @tailwindcss/cli
```

### 2. Create `src/client/tailwind.css` (input file)

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

### 3. Modify `buildClientAssets()` in `src/server/assets.ts`

Add the Tailwind CLI step before `Bun.build`:

```ts
export async function buildClientAssets(): Promise<void> {
  // Compile Tailwind v4 → src/client/.tailwind.css (no PostCSS needed).
  await Bun.$`bunx @tailwindcss/cli -i src/client/tailwind.css -o src/client/.tailwind.css --minify`.quiet()
  const result = await Bun.build({
    entrypoints: ['src/client/app.tsx'],
    // ... existing config
  })
  // ...
}
```

### 4. Import `.tailwind.css` in `src/client/app.tsx`

```ts
import "./.tailwind.css";  // Tailwind output (preflight + utilities)
import "./styles.css";     // custom CSS (overrides Tailwind via cascade)
```

Import `.tailwind.css` **before** `styles.css` so custom CSS wins on equal specificity.

### 5. Add `src/client/.tailwind.css` to `.gitignore`

```
src/client/.tailwind.css
```

### 6. Add dev scripts to `package.json`

```json
"dev:css": "bunx @tailwindcss/cli -i src/client/tailwind.css -o src/client/.tailwind.css --watch",
"dev:all": "bunx @tailwindcss/cli -i src/client/tailwind.css -o src/client/.tailwind.css --watch & bun --watch src/index.ts"
```

## Why no PostCSS is needed

Bun.build does not process `@import "tailwindcss"` — it treats it as CSS file import resolution, not a PostCSS directive. So the `postcss.config.mjs` + `@tailwindcss/postcss` approach (used by Vite/Next.js) does not work with Bun.build.

Instead, `@tailwindcss/cli` compiles Tailwind to a static CSS file (`.tailwind.css`), then Bun.build bundles it like regular CSS. No PostCSS runtime required.

## Key findings

### 1. Cascade layers: custom CSS overrides Tailwind utilities

Tailwind v4 uses `@layer utilities` for utility classes. Custom CSS (`.auth-sub`, `.btn`, `.panel`) is unlayered, so it **wins** over Tailwind utilities with equal specificity. This is expected and allows gradual migration — existing styles keep working.

### 2. `@theme inline` = runtime CSS variable resolution

With `@theme inline { --color-primary: var(--primary) }`, the `text-primary` utility compiles to `color: var(--primary)`. Since `var()` is evaluated at runtime, dark mode auto-switches without duplicating values.

### 3. `@custom-variant dark` maps to `[data-theme]`

Tailwind v4 defaults to `prefers-color-scheme` for dark mode. Override it:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Result: `dark:text-danger` → `dark\:text-danger:where([data-theme=dark],[data-theme=dark] *) { color: var(--danger) }`.

### 4. Automatic content detection

Tailwind v4 CLI automatically scans source files for class names — no `content: [...]` config needed (unlike v3). Classes only injected via JavaScript at runtime (not present in source files) will **not** be generated.

## Verification (2026-08-04)

| Test | Light | Dark | Status |
|---|---|---|---|
| `text-primary` | `#059669` | `#10b981` | ✅ Auto-switch via var() |
| `dark:text-danger` | `#059669` (primary) | `#dc2626` (danger) | ✅ Dark variant works |
| `[data-theme="dark"]` selector | — | match | ✅ Custom variant |
| Build pipeline | CLI → Bun.build → manifest | — | ✅ |

## Architecture after integration

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
