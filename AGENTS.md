# AGENTS.md

Guidelines for AI coding agents working on this repository. Read this before
writing, moving, or restructuring code. The README documents features in
depth; this file exists to keep new code structurally consistent — previous
contributions broke the architecture by inventing their own layout.

## Stack

- **Bun >= 1.3** — runtime, bundler, and test runner.
- **Elysia 1.4.x** (HTTP). Pinned to 1.x on purpose: Elysia 2 is beta and
  changes hook APIs. Do not upgrade casually.
- **bun:sqlite** — synchronous, zero-ORM. Schema lives in `migrations/`
  (versioned SQL applied at startup, see `migrations.ts`).
- **Inertia v3 + Svelte 5** — in-process SSR; page registry in
  `src/client/pages.ts` with explicit imports.
- **Tailwind CSS v4** — compiled via `@tailwindcss/cli` (no PostCSS) as a
  pre-build step in `assets.ts`; see README "Styling". Run `bun run dev:css`
  alongside `bun run dev` for live Tailwind compilation in development.

## Layout

```
src/
├── index.ts                # entry: build assets (dev), listen, graceful shutdown
├── server/
│   ├── app.ts              # composition: logging, CSRF, onError, routes
│   ├── config.ts           # validated env config (fails fast at startup)
│   ├── db.ts               # bun:sqlite: connection + ALL prepared statements
│   ├── migrations.ts       # SQL migration runner
│   ├── auth.ts             # argon2id, sessions, flash, cookies, guards
│   ├── inertia.ts          # Inertia v3 server adapter (SSR via pre-built dist/ssr.js, XHR, 409)
│   ├── inertia-plugin.ts   # store declarations + per-request session resolve
│   ├── mailer.ts           # mail drivers: log / resend / mailtrap
│   ├── rate-limit.ts       # in-memory fixed-window rate limiter
│   ├── logger.ts           # request logging + x-request-id
│   ├── svelte-plugin.ts    # Bun.build plugin: compile .svelte + .svelte.js (Svelte 5 runes)
│   ├── ssr.d.ts            # type decl for lazy-imported dist/ssr.js
│   ├── assets.ts           # Tailwind v4 compile + Bun.build (client+SSR) + manifest + static serving
│   ├── tus-protocol.ts     # tus v1 protocol constants & helpers
│   ├── tus-storage.ts      # tus upload bytes on disk
│   └── routes/
│       ├── auth.routes.ts         # /login /register /logout /forgot-password /reset-password (GET+POST)
│       ├── google-oauth.routes.ts # /auth/google, /auth/google/callback
│       ├── pages.routes.ts        # app-shell pages: /, /dashboard, /admin
│       ├── profile.routes.ts      # /profile page + /profile/avatar
├── client/                 # Svelte + Inertia (pages/, components/, tailwind.css, styles.css)
├── shared/                 # types.ts, inertia.d.ts (client+server shared)
├── migrations/             # versioned SQL schema files (0001, 0002, …)
└── tests/                  # bun:test E2E suite (in-memory DB)
```

## Hard rules

1. **Routes live in `src/server/routes/<feature>.routes.ts`, handlers inline,
   one file per URL.** Route-specific handler logic stays in the route file
   (see `auth.routes.ts`, `uploads.routes.ts`); never create a `routes.ts`
   inside a feature folder. The feature name is derived from the URL, and
   every URL is defined in exactly one file — GET renders and POST actions
   live together (see "Route conventions" below).

2. **`src/server/` is flat except `routes/`. No feature subfolders.**
   Shared or transport-independent logic becomes a single flat module
   (`auth.ts`, `security.ts`, `mailer.ts`, `rate-limit.ts`, `tus-protocol.ts`,
   `tus-storage.ts`). Extract a module only when logic is reused across
   routes or independent of Elysia's context — not just to slim a file.

3. **All SQL lives in `db.ts`** as prepared statements created at module
   load (`db.query(...)`). Schema changes are new numbered files
   `migrations/000N_*.sql`; never edit an applied migration. Keep `db.ts`
   a single file — one coherent module reads better than a tree of small
   domain files; reconsider splitting by domain only past ~600–800 lines.

4. **Env is read once, in `config.ts`**, which validates and fails fast.
   Never read `process.env` in other modules. Adding a config key means
   updating `config.ts` and the README env table.

5. **Validation via TypeBox schemas** at the route level; `onError` maps
   failures to Inertia 422 page payloads (`VALIDATION_MESSAGES` in
   `auth.routes.ts`).

6. **TypeScript**: `strict` + `noUncheckedIndexedAccess` +
   `verbatimModuleSyntax` are on. Type-only imports MUST use `import type`.
   No ORM, no loose `any`; queries are parameterized. Type-checking uses
   `svelte-check` (not `tsc`) because `.svelte` components need the Svelte
   language server; there is no `jsx` tsconfig key (Svelte compiles JSX).

## Route conventions

- **File = URL namespace.** `/posts*` routes live in `routes/posts.routes.ts`
  with page renders and form actions together. Given a URL, the file name
  follows from its first segment — that is the discoverability contract.
- **`pages.routes.ts` is the app shell only** (/, /dashboard, /admin). New
  feature pages do not go there.
- **Infra endpoints** (`/health`, `/assets/*`) stay in `app.ts`, not route
  files.
- **Exports**: `const <feature>Routes = (assets) => new Elysia()...`, mounted
  via `.use(<feature>Routes(assets))` in `app.ts`; Elysia instance names are
  `<feature>-routes`.

## Elysia 1.4 + Svelte 5 quirks (do not "fix")

- Hooks apply in registration order; the global `onError` must precede the
  routes it covers.
- Plugins without routes drop their hooks — session resolve must be
  registered on the route-bearing instances.
- `elysia-rate-limit` is incompatible with 1.4 — the limiter is hand-rolled
  in `rate-limit.ts`.
- `import.meta.glob` was removed from Bun 1.3 — the page registry uses
  explicit imports.
- Svelte 5 runes (`$state`, `$props`, `$derived`, `$effect`) are compiler
  macros, not runtime JS. `svelte-plugin.ts` compiles `.svelte` and
  `.svelte.js` (the latter ships in `@inertiajs/svelte`) — without it Bun
  errors "`$state` is not defined".
- SSR is pre-built to `dist/ssr.js` by `buildClientAssets()` and
  lazy-imported by `inertia.ts`. A static import fails at module load when
  `dist/` is empty (fresh clone); the `svelte` export condition that
  `@inertiajs/svelte` requires is resolvable by `Bun.build` via
  `conditions: ['svelte']` but not by the Bun runtime.

## Testing

- Run **`bun test --isolate`** (or `bun run test`). NEVER plain `bun test`:
  bun 1.3 runs all test files in one shared process, but each suite sets its
  env in `beforeAll` and calls `db.close()` in `afterAll` as if process-
  isolated. Without `--isolate`, one file's teardown finalizes the next
  file's prepared statements and cached `config` values leak across files.
- New test files must set env (`DATABASE_PATH=:memory:`, `UPLOAD_DIR`, …)
  in `beforeAll` BEFORE importing the app module — mirror
  `tests/app.test.ts` and `tests/tus.test.ts`.
- Suite must stay green (46 tests): run `bun run typecheck` and
  `bun run test` before finishing. `svelte-check` covers `src/` and
  `scripts/` (it understands `.svelte` components; `tsc` does not).

## Style
- Match the dominant repo style in new files: tab indent, double quotes,
  semicolons for `.ts` server/test files (as in `auth.routes.ts` and
  `tests/`); 2-space indent, single quotes, no semicolons for `.svelte`
  components (as in `pages/Login.svelte`). When editing an existing file,
  match that file's formatting.
- Keep changes minimal and conventional; delete dead code rather than
  leaving shims or aliases behind a rename.
