# AGENTS.md

Guidelines for AI coding agents working on this repository. Read this before
writing, moving, or restructuring code. The README documents features in
depth; this file exists to keep new code structurally consistent — previous
contributions broke the architecture by inventing their own layout.

## Stack

- **Bun >= 1.3** — runtime, bundler, and test runner.
- **Hono 4.x** (HTTP). Stable, runtime-agnostic; served via `Bun.serve` with
  `app.fetch` (Bun hands the server to fetch as its 2nd arg → `c.env`).
- **bun:sqlite** — synchronous, zero-ORM. Schema lives in `migrations/`
  (versioned SQL applied at startup, see `migrations.ts`).
- **Inertia v3 + Svelte 5** — in-process SSR; page registry in
  `src/client/pages.ts` with explicit imports.
- **Tailwind CSS v4** — utility classes in components; `@tailwindcss/cli` as a
  pre-build step (no PostCSS). Design tokens via CSS variables in
  `src/client/styles.css`, bridged to Tailwind via `@theme inline` in
  `src/client/tailwind.css` (see README "Styling").

## Layout

```
src/
├── index.ts                # entry: build assets (dev), Bun.serve, graceful shutdown
├── server/
│   ├── app.ts              # composition: middleware order, onError, notFound, routes
│   ├── config.ts           # validated env config (fails fast at startup)
│   ├── db.ts               # bun:sqlite: connection + ALL prepared statements
│   ├── migrations.ts       # SQL migration runner
│   ├── auth.ts             # argon2id, sessions, flash, cookies, guards
│   ├── inertia.ts          # Inertia v3 server adapter (framework-light)
│   ├── inertia-middleware.ts # per-request session resolve → c.var (AppEnv)
│   ├── validation.ts       # TypeBox JSON validation → ValidationFailed (422)
│   ├── mailer.ts           # mail drivers: log / resend / mailtrap
│   ├── rate-limit.ts       # in-memory fixed-window rate limiter
│   ├── logger.ts           # batched request logging + x-request-id
│   ├── compress.ts         # gzip compression (node:zlib, not CompressionStream)
│   ├── cache.ts            # CDN cache middleware: cacheablePublic + noStore
│   ├── security.ts         # CSRF origin check + hardening headers (hono/secure-headers)
│   ├── metrics.ts          # in-memory Prometheus metrics + /metrics endpoint
│   ├── url.ts              # defensive request-URL parsing
│   ├── assets.ts           # Bun.build pipeline + manifest + static serving
│   ├── tus-protocol.ts     # tus v1 protocol constants & helpers
│   ├── tus-storage.ts      # tus upload bytes on disk
│   └── routes/
│       ├── api.routes.ts          # /api/session (user identity for public pages)
│       ├── auth.routes.ts         # /login /register /logout /forgot-password /reset-password (GET+POST)
│       ├── google-oauth.routes.ts # /auth/google, /auth/google/callback
│       ├── pages.routes.ts        # app-shell pages: / (public cacheable), /dashboard, /admin
│       ├── profile.routes.ts      # /profile page + /profile/avatar
│       └── uploads.routes.ts      # /uploads* (tus protocol)
├── client/                 # React + Inertia (pages/, components/, styles.css)
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
   routes or independent of Hono's context — not just to slim a file.

3. **All SQL lives in `db.ts`** as prepared statements created at module
   load (`db.query(...)`). Schema changes are new numbered files
   `migrations/000N_*.sql`; never edit an applied migration. Keep `db.ts`
   a single file — one coherent module reads better than a tree of small
   domain files; reconsider splitting by domain only past ~600–800 lines.

4. **Env is read once, in `config.ts`**, which validates and fails fast.
   Never read `process.env` in other modules. Adding a config key means
   updating `config.ts` and the README env table.

5. **Validation via TypeBox schemas** (`src/server/validation.ts`) at the
   route level; `app.onError` maps `ValidationFailed` to Inertia 422 page
   payloads (`VALIDATION_MESSAGES` in `auth.routes.ts`).

6. **TypeScript**: `strict` + `noUncheckedIndexedAccess` +
   `verbatimModuleSyntax` are on. Type-only imports MUST use `import type`.
   No ORM, no loose `any`; queries are parameterized.

7. **UI work follows the design system — never invents a parallel one.**
   Before creating or editing UI, read `.llm-wiki/wiki/concepts/ui-design-principles.md`
   and `ui-anti-patterns.md`. Reuse tokens from `styles.css` / `tailwind.css`
   and existing components; don't reach for AI-default aesthetics (beige,
   ghost cards, purple gradients, italic serif accents). New styling = new
   utility classes in the component, per the Tailwind conventions below.
   Forms use `useForm` + `<form>` from `@inertiajs/svelte` — see
   `.llm-wiki/wiki/concepts/concept-inertia-form-patterns.md` for the
   decision rule and examples.

8. **UI work follows the design system — never invents a parallel one.**
   Before creating or editing UI, read `.llm-wiki/wiki/concepts/ui-design-principles.md`
   and `ui-anti-patterns.md`. Reuse tokens from `styles.css` and existing
   components; don't reach for AI-default aesthetics (beige, ghost cards,
   purple gradients, italic serif accents). New components add co-located
   styles per rule 7.

## Route conventions

- **File = URL namespace.** `/posts*` routes live in `routes/posts.routes.ts`
  with page renders and form actions together. Given a URL, the file name
  follows from its first segment — that is the discoverability contract.
- **`pages.routes.ts` is the app shell only** (/, /dashboard, /admin). New
  feature pages do not go there.
- **Infra endpoints** (`/health`, `/assets/*`) stay in `app.ts`, not route
  files.
- **Exports**: `const <feature>Routes = () => new Hono<AppEnv>()...`, mounted
  via `app.route('/', <feature>Routes())` in `app.ts`. Route factories take
  no arguments — the Inertia adapter is a global middleware on the app, not
  per-route state.


## CDN cache pattern (public vs auth pages)

The app distinguishes **public pages** (cacheable at the Cloudflare edge)
from **auth pages** (private, never cached). This is the core optimisation
that lets a single Bun process serve high traffic — CF absorbs 90%+ of
reads.

### Public pages

- Rendered with `{ public: true }` in the Inertia adapter: `auth.user` and
  `flash` are omitted from the page props, so the HTML is identical for
  all visitors.
- Wrapped in `cacheablePublic(sMaxAge, swr)` middleware → sets
  `Cache-Control: public, s-maxage=N, stale-while-revalidate=M` on 200
  HTML responses (Inertia XHR excluded).
- SSR runs even for logged-in users (the HTML is user-agnostic).
- User identity is fetched client-side via `GET /api/session` after
  hydration — see `src/client/session.ts` (`useSession()` hook).
- Example: `/` (Home page).

### Auth pages

- Rendered normally (with `auth.user` in Inertia props).
- No `Cache-Control` header set (browser default = no caching). Add
  `noStore` middleware explicitly if needed.
- SSR is skipped for logged-in users (no SEO benefit; ship empty shell).
- User identity comes from Inertia props directly — no `/api/session`
  fetch needed.
- Example: `/dashboard`, `/admin`, `/profile`, `/login`, `/register`.

### SPA cache-key separation

Inertia XHR navigations carry `X-Inertia: true` and are excluded from the
public cache header. The client also appends `?_spa=1` to XHR URLs (see
`app.tsx`) so Cloudflare caches JSON and HTML under separate cache keys.
After navigation, the param is stripped from the address bar.

### When to use which pattern

Use **public** (`{ public: true }` + `cacheablePublic`) for any page that
should be cacheable: landing, content, search, about. The page must not
rely on `auth.user` for its initial render — use `useSession()` instead.

Use **auth** (default Inertia props) for any page behind `requireAuth` or
`requireRole`: dashboard, admin, profile, settings. These pages are
private and always receive user data via Inertia props.

## Hono integration notes (do not "fix")

- Middleware runs in registration order; global `app.use()` middleware must
  precede the routes they cover.
- Middleware/guards MUST call `next()` to continue the chain — returning
  `undefined` without `next()` errors with "Context is not finalized".
- Hono converts HEAD → GET (body stripped, headers kept) but `c.req.method`
  still reports "HEAD"; tus `dispatch` relies on this.
- `c.header()`-queued headers are dropped when a handler returns a custom
  `Response` — cookie helpers append to `c.res.headers` instead.
- The `/*` wildcard produces no named param — derive path segments from
  `c.req.path` (see `uploads.routes.ts`).
- `hono/conninfo`'s ESM build is an empty stub in 4.13 — the rate limiter
  reads the peer IP from `c.env` (the Bun server) instead.
- `@sinclair/typebox` does not pre-register string formats — `email` is
  registered in `validation.ts`; add others there.
- The Web `CompressionStream` API is NOT reliably available in every Bun
  1.3.14 context — compression uses `node:zlib` (`compress.ts`), and any
  future code should avoid relying on Web compression globals.

## Testing

- Run **`bun test --isolate`** (or `bun run test`). NEVER plain `bun test`:
  bun 1.3 runs all test files in one shared process, but each suite sets its
  env in `beforeAll` and calls `db.close()` in `afterAll` as if process-
  isolated. Without `--isolate`, one file's teardown finalizes the next
  file's prepared statements and cached `config` values leak across files.
- New test files must set env (`DATABASE_PATH=:memory:`, `UPLOAD_DIR`, …)
  in `beforeAll` BEFORE importing the app module — mirror
  `tests/app.test.ts` and `tests/tus.test.ts`.
- Suite must stay green: run `bun run typecheck` and
  `bun run test` before finishing. `tsc` only covers `src/` and `scripts/`.

## Browser testing

- When testing in the browser, ALWAYS open the browser console (DevTools →
  Console) and check for errors/warnings. Client-side runtime errors
  (failed imports, Svelte runtime errors, hydration issues, bad Inertia
  props, network 4xx/5xx on XHR) do NOT show up in `bun run typecheck` or
  the build — the build compiles, the page renders, and the bug is silent
  until you read the console. A green build + green tests does NOT mean the
  page works; the console is the source of truth for client-side failures.
- Use the `browser` tool (`xd://browser`) to drive a real tab and read
  `console` output, or screenshot DevTools. Do not declare a UI change
  verified without having read the console for the page you changed.

## Style

- **Styling is done with Tailwind utility classes** in Svelte components
  (`class="flex items-center gap-2 …"`). Do NOT write component CSS in
  `src/client/styles.css` — that file holds only design-token CSS variables
  and `@keyframes`. New styling = new utility classes in the component.
- Design tokens (`--primary`, `--surface`, `--border`, …) are defined in
  `src/client/styles.css` and bridged to Tailwind theme tokens via
  `@theme inline` in `src/client/tailwind.css`. Use the token-based
  utilities (`bg-surface`, `text-primary`, `border-border`, `text-muted`,
  `bg-primary-soft`, etc.) so dark mode auto-switches via `var()`.
- Dark mode uses `[data-theme="dark"]` on `<html>` (not
  `prefers-color-scheme`). Use the `dark:` variant for one-off dark-only
  overrides: `dark:bg-green-950 dark:text-green-300`.
- `@keyframes` that cannot be expressed as utilities live in `styles.css`
  and are referenced via `animate-[name_duration_ease]`.
- Match the repo's current style: 2-space indent, double quotes, semicolons
  (normalized by the editor/agent formatter; `tests/` and the route files are
  the reference). When editing an existing file, match that file's
  formatting.
- Keep changes minimal and conventional; delete dead code rather than
  leaving shims or aliases behind a rename.
