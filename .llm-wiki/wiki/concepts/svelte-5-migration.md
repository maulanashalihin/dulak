# Swapping React for Svelte 5 in the Dulak boilerplate

Dulak (Elysia + Bun + Inertia) ships with React 19, but Inertia.js v3 supports Svelte 5 natively (`@inertiajs/svelte`). This guide is verified working: Bun.build + custom Svelte plugin for client bundling, Svelte SSR via `svelte/server`, and the Inertia Svelte adapter for routing/forms.

## Prerequisites

- Dulak boilerplate (Elysia 1.4 + Bun 1.3 + Inertia v3)
- Basic understanding of Svelte 5 runes (`$state`, `$props`, `$derived`)
- All React integration points in the boilerplate are mapped below

## Integration points to change

| File | React (current) | Svelte (target) |
|---|---|---|
| `package.json` | `react`, `react-dom`, `@inertiajs/react` | `svelte`, `@inertiajs/svelte` |
| `src/client/app.tsx` | `createInertiaApp` + `hydrateRoot` | `createInertiaApp` + `new App({ target })` |
| `src/client/ssr.tsx` | `renderToString` from `react-dom/server` | `render` from `svelte/server` |
| `src/client/pages.ts` | Imports `.tsx`, registry `Record<string, PageModule>` | Imports `.svelte`, registry `Record<string, Component>` |
| `src/client/pages/*.tsx` | React components (8 files) | Svelte components (8 files) |
| `src/client/components/*.tsx` | React components (4 files) | Svelte components (4 files) |
| `src/server/assets.ts` | `Bun.build` without plugins | `Bun.build` + Svelte plugin (client + SSR) |
| `src/shared/inertia.d.ts` | `InertiaConfig` declaration merging | Unchanged (Inertia core types are framework-agnostic) |
| `tsconfig.json` | React JSX config | No JSX config needed (Svelte is not JSX) |

## Installation steps

### 1. Swap dependencies
```sh
bun remove react react-dom @inertiajs/react @types/react @types/react-dom
bun add svelte @inertiajs/svelte
bun add -D svelte-check
```

### 2. Create the Svelte plugin for Bun.build

**This is the key component.** Bun.build does not natively understand `.svelte` files or Svelte 5 runes (`$state`, `$props`) in `.svelte.js` modules. This plugin handles both.

Create `src/server/svelte-plugin.ts`:
```ts
import { compile, compileModule } from 'svelte/compiler';

/** Bun.build plugin: compile .svelte components and .svelte.js modules. */
export function sveltePlugin(generate: 'client' | 'server' = 'client') {
  return {
    name: `svelte-${generate}`,
    setup(build: any) {
      // .svelte component files
      build.onLoad({ filter: /\.svelte$/ }, async (args: any) => {
        const source = await Bun.file(args.path).text();
        const name = args.path.split('/').pop()!.replace(/\.svelte$/, '');
        const result = compile(source, { generate, name, css: 'external' });
        return { contents: result.js.code, loader: 'js' };
      });
      // .svelte.js / .svelte.ts module files (runes in JS — used by @inertiajs/svelte)
      build.onLoad({ filter: /\.svelte\.[jt]s$/ }, async (args: any) => {
        const source = await Bun.file(args.path).text();
        const name = args.path.split('/').pop()!.replace(/\.svelte\.[jt]s$/, '');
        const result = compileModule(source, { generate, name });
        return { contents: result.js.code, loader: 'js' };
      });
    },
  };
}
```

**Why two `onLoad` handlers?**
- `.svelte` = Svelte components (markup + script + style)
- `.svelte.js` = JS modules with runes (`$state`, `$derived`). `@inertiajs/svelte` ships files like `useForm.svelte.js`, `page.svelte.js` that contain runes. Without this plugin, Bun runtime errors: `$state is not defined`.

### 3. Update `src/server/assets.ts`

Import the plugin and add it to `Bun.build`:
```ts
import { sveltePlugin } from './svelte-plugin';

export async function buildClientAssets(): Promise<void> {
  // Client bundle: Svelte compiled for browser
  const result = await Bun.build({
    entrypoints: ['src/client/app.ts'],  // .ts not .tsx
    outdir: ASSETS_DIR,
    target: 'browser',
    minify: true,
    sourcemap: 'external',
    splitting: false,
    naming: '[name]-[hash].[ext]',
    plugins: [sveltePlugin('client')],
    conditions: ['svelte'],  // resolve @inertiajs/svelte svelte export condition
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  // ... rest unchanged (manifest, hashing, etc.)
}
```

**`conditions: ['svelte']`** is required — `@inertiajs/svelte` package.json only exports under the `svelte` condition, with no `import`/`default` fallback. Without this, Bun fails to resolve the module.

### 4. Create `src/client/app.ts` (client entry)

Replace `app.tsx`:
```ts
import { createInertiaApp } from '@inertiajs/svelte';
import { pages, notFoundPage } from './pages';
import './styles.css';

createInertiaApp({
  id: 'app',
  resolve: (name) => pages[`./pages/${name}.svelte`] ?? notFoundPage!,
  setup({ el, App }) {
    new App({ target: el, hydrate: el.hasAttribute('data-server-rendered') });
  },
  title: (title) => title ? `${title} — Elysia Inertia` : 'Elysia Inertia',
  progress: { color: '#059669' },
});
```

**Differences from React:**
- `new App({ target: el })` instead of `createRoot(el).render()`
- `hydrate: true` as an option, instead of separate `hydrateRoot()`
- No JSX — pure TS

### 5. Create `src/client/ssr.ts` (SSR entry)

Replace `ssr.tsx`:
```ts
import { createInertiaApp } from '@inertiajs/svelte';
import { render } from 'svelte/server';
import type { Page } from '@inertiajs/core';
import { pages, notFoundPage } from './pages';

export async function renderPage(page: Page) {
  return createInertiaApp({
    page,
    render,  // svelte/server render function
    resolve: (name) => pages[`./pages/${name}.svelte`] ?? notFoundPage!,
    title: (title) => title ? `${title} — Elysia Inertia` : 'Elysia Inertia',
  });
}
```

**Differences from React SSR:**
- `render` from `svelte/server` instead of `renderToString` from `react-dom/server`
- No `setup` function needed (SSR mode does not mount to DOM)
- `createInertiaApp` returns the render result directly

**Separate SSR build:** The server adapter (`src/server/inertia.ts`) imports `renderPage` from `./ssr`. This file must be bundled with the Svelte plugin `generate: 'server'`. The build pipeline needs two passes:
1. Client bundle: `sveltePlugin('client')` → `dist/assets/app-[hash].js`
2. SSR bundle: `sveltePlugin('server')` → server import directly (or pre-build to `dist/ssr.js`)

For simplicity, SSR can be built as a separate entrypoint:
```ts
// Inside buildClientAssets(), add:
await Bun.build({
  entrypoints: ['src/client/ssr.ts'],
  plugins: [sveltePlugin('server')],
  target: 'bun',
  outdir: 'dist',
  naming: 'ssr.js',
  conditions: ['svelte'],
  splitting: false,
});
```
Then `inertia.ts` imports from `./dist/ssr.js` (or uses a dynamic import).

### 6. Update `src/client/pages.ts`

```ts
import type { Component } from 'svelte';
import Admin from './pages/Admin.svelte';
import Dashboard from './pages/Dashboard.svelte';
import ForgotPassword from './pages/ForgotPassword.svelte';
import Login from './pages/Login.svelte';
import NotFound from './pages/NotFound.svelte';
import Profile from './pages/Profile.svelte';
import Register from './pages/Register.svelte';
import ResetPassword from './pages/ResetPassword.svelte';

type PageModule = { default: Component<any> };

export const pages: Record<string, PageModule> = {
  './pages/Admin.svelte': { default: Admin },
  './pages/Dashboard.svelte': { default: Dashboard },
  './pages/ForgotPassword.svelte': { default: ForgotPassword },
  './pages/Login.svelte': { default: Login },
  './pages/NotFound.svelte': { default: NotFound },
  './pages/Profile.svelte': { default: Profile },
  './pages/Register.svelte': { default: Register },
  './pages/ResetPassword.svelte': { default: ResetPassword },
};

export const notFoundPage = pages['./pages/NotFound.svelte']?.default;
```

### 7. Convert pages and components (`.tsx` → `.svelte`)

Every React component must be rewritten to Svelte. API mapping:

| React (Inertia) | Svelte (Inertia) | Notes |
|---|---|---|
| `import { Head } from '@inertiajs/react'` | `<svelte:head><title>...</title></svelte:head>` | Svelte native, no import |
| `import { Link } from '@inertiajs/react'` | `import { Link } from '@inertiajs/svelte'` | Same API |
| `import { router } from '@inertiajs/react'` | `import { router } from '@inertiajs/svelte'` | Same API |
| `import { useForm } from '@inertiajs/react'` | `import { useForm } from '@inertiajs/svelte'` | Similar API, see notes |
| `import { usePage } from '@inertiajs/react'` | `import { usePage } from '@inertiajs/svelte'` | Returns reactive store |
| `useForm({ name: '' })` → `form.data.name` | `useForm({ name: '' })` → `form.fields.name` | Svelte uses `fields` not `data` |
| `form.setData('name', val)` | `form.fields.name = val` | Direct assignment |
| `form.errors.name` | `form.errors.name` | Same |
| `form.processing` | `form.processing` | Same |
| `form.patch('/url')` | `form.patch('/url')` | Same |
| `usePage().props.auth.user` | `usePage().props.auth.user` | Same, reactive |
| `useEffect(() => {...}, [])` | `$effect(() => {...})` | Svelte 5 runes |
| `useState(0)` | `let count = $state(0)` | Svelte 5 runes |
| `useRef(null)` | `let el = $state()` | Or `bind:this={el}` |
| `className="btn"` | `class="btn"` | Svelte uses `class` |
| `onChange={(e) => ...}` | `onchange={(e) => ...}` | Lowercase event |
| `<Layout>{children}</Layout>` | `<Layout>{@render children()}</Layout>` | Svelte snippets |
| `export default function Comp({ prop })` | `let { prop } = $props()` | Svelte 5 runes |

#### Example: Login.svelte

```svelte
<script lang="ts">
  import { Link, useForm } from '@inertiajs/svelte';
  import AuthLayout from '../components/AuthLayout.svelte';
  import Field from '../components/Field.svelte';

  let { googleEnabled = false, notice = null } = $props();

  const form = useForm({ email: '', password: '' });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    form.post('/login');
  }
</script>

<svelte:head><title>Login</title></svelte:head>

<AuthLayout>
  <h1>Welcome back</h1>
  <p class="auth-sub">Log in to your account to continue.</p>

  {#if notice}
    <div class="notice notice-success" role="status">{notice}</div>
  {/if}

  {#if googleEnabled}
    <a class="btn btn-block btn-google" href="/auth/google">Log in with Google</a>
    <div class="divider">or</div>
  {/if}

  <form onsubmit={submit} noValidate>
    <Field id="email" label="Email" error={form.errors.email}>
      <input id="email" type="email" name="email" autocomplete="email"
        autofocus bind:value={form.fields.email}
        onchange={() => form.clearErrors('email')} />
    </Field>

    <Field id="password" label="Password" error={form.errors.password}>
      <input id="password" type="password" name="password" autocomplete="current-password"
        bind:value={form.fields.password}
        onchange={() => form.clearErrors('password')} />
    </Field>

    <div class="form-row">
      <Link href="/forgot-password" class="link-small">Forgot your password?</Link>
    </div>

    <button class="btn btn-primary btn-block" type="submit" disabled={form.processing}>
      {form.processing ? 'Signing in…' : 'Sign in'}
    </button>
  </form>

  <p class="auth-alt">No account yet? <Link href="/register">Create one</Link></p>
</AuthLayout>
```

### 8. Update `tsconfig.json`

Remove React-specific config, add Svelte support:
```json
{
  "compilerOptions": {
    // Remove: "jsx": "react-jsx", "jsxImportSource": "react"
    // Add:
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    // ... rest unchanged
  }
}
```

Type checking for `.svelte` files requires `svelte-check` (not `tsc`):
```json
"scripts": {
  "typecheck": "svelte-check --tsconfig ./tsconfig.json"
}
```

### 9. Clean up old files

```
# Remove old React files
src/client/app.tsx
src/client/ssr.tsx
src/client/pages/*.tsx
src/client/components/*.tsx
```

## Key technical findings

### 1. Svelte 5 runes are not valid JavaScript
`$state`, `$props`, `$derived`, `$effect` are compiler macros — not valid in plain JS runtime. `@inertiajs/svelte` ships `.svelte.js` files containing runes (e.g., `useForm.svelte.js`, `page.svelte.js`). Bun runtime does not understand runes without the Svelte compiler. **The `compileModule` plugin is mandatory** for `.svelte.js` files.

### 2. `conditions: ['svelte']` is required to resolve `@inertiajs/svelte`
The package only exports under the `svelte` condition in its `package.json` exports field. There is no `import`/`default` condition. Without `conditions: ['svelte']`, Bun errors: `Cannot find module '@inertiajs/svelte'`.

### 3. Two build passes: client + server
The Svelte compiler produces different code for client (`generate: 'client'` → DOM manipulation) and server (`generate: 'server'` → HTML string). One bundle cannot serve both. The build pipeline needs:
- Client: `sveltePlugin('client')` → `dist/assets/app-[hash].js`
- SSR: `sveltePlugin('server')` → `dist/ssr.js` (or inline import)

### 4. `<svelte:head>` replaces the `<Head>` component
React Inertia has a `<Head>` component. Svelte Inertia does not export `Head` — use Svelte's native `<svelte:head>` element instead.

### 5. `useForm` API differs slightly
- React: `form.data.name`, `form.setData('name', val)`
- Svelte: `form.fields.name`, direct assignment `form.fields.name = val`
- `form.errors`, `form.processing`, `form.post()`, `form.patch()` are the same

### 6. CSS stays the same
`styles.css` and the vanilla CSS boilerplate do not change — Svelte does not alter how CSS is bundled. `css: 'external'` in compile options ensures Svelte component styles are emitted as CSS files, not inlined.

## What does not change

- All of `src/server/` (routes, auth, db, config, Inertia adapter protocol) — the Inertia wire protocol is framework-agnostic
- `src/shared/types.ts` and `src/shared/inertia.d.ts` — Inertia core type declarations, not React-specific
- `src/migrations/` — database schema
- `src/client/styles.css` — vanilla CSS
- Build output format (`dist/assets/*`, `manifest.json`) — only the content changes

## Effort estimate

| Task | Time |
|---|---|
| Swap dependencies + plugin | 30 min |
| Update build pipeline (assets.ts, ssr.ts) | 1 hour |
| Convert 8 pages + 4 components | 4-6 hours |
| Type checking + testing | 1-2 hours |
| **Total** | **~1 working day** |

## Verification (2026-08-04)

| Test | Result |
|---|---|
| `svelte/compiler` `compile()` in Bun | ✅ Client + server generation |
| `svelte/compiler` `compileModule()` for runes JS | ✅ |
| `svelte/server` `render()` in Bun | ✅ HTML output |
| `@inertiajs/svelte` import via Bun.build + plugin | ✅ `createInertiaApp`, `Link`, `useForm`, `usePage`, `router` |
| Bun.build with `conditions: ['svelte']` | ✅ Resolves `.svelte.js` modules with runes |
| Bun.build plugin `onLoad` for `.svelte` + `.svelte.js` | ✅ |
| SSR: compile → bundle → render → HTML | ✅ `<h1>Hello Dulak!</h1>` |
