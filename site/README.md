# Dulak site

The Dulak landing page + documentation, built with **Astro + Starlight**
(fully static — no server adapter).

## Develop

```bash
cd site
npm install
npm run dev        # http://localhost:4321
```

## Build

```bash
npm run build      # static output → site/dist
```

## Deploy (Cloudflare Pages)

- **Dashboard**: root directory `site`, build `npm run build`, output `dist`.
- **CLI**: `npx wrangler pages deploy dist --project-name dulak-site`
  (`site/wrangler.toml` pins the config).
- **CI**: `.github/workflows/deploy-site.yml` deploys on pushes touching
  `site/` — requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
  repository secrets.

Set the production domain in `astro.config.mjs` (`site`) before going live.

## Content

- Landing page: `src/content/docs/index.mdx` (Starlight hero + custom
  sections via `src/components/*.astro`).
- Docs: `src/content/docs/**/*.mdx` — sidebar configured in
  `astro.config.mjs`.
- Theme overrides: `src/styles/custom.css`.

Keep docs in sync with code changes in the same PR.
