---
type: source
title: "Observation: Landing + docs site live at dulak.pages.dev"
slug: obs-2026-08-05-landing-docs-site-live-at-dulak-pages-dev
status: observation
created: 2026-08-05
updated: 2026-08-05
relevance: high
observed_at: 2026-08-05T04:45:36.874Z
tags: ["dulak", "site", "cloudflare-pages", "deploy"]
source_context: "Publishing the Dulak landing + docs site"
---
# ⭐ Observation: Landing + docs site live at dulak.pages.dev
Dulak site (Astro 7 + Starlight, site/ folder) deployed to Cloudflare Pages at https://dulak.pages.dev. Project name = 'dulak' (subdomain = project name), root dir site/, build npm run build, output dist. Verified live: landing hero (bun create dulak terminal), docs intro, philosophy page, favicon all 200. wrangler.toml + .github/workflows/deploy-site.yml use project name 'dulak'. Deployed via Cloudflare dashboard (Connect to Git); CI deploys need CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID secrets. README badges updated (website + create-dulak npm).
*Relevance: high*

*Context: Publishing the Dulak landing + docs site*

*Tags: dulak site cloudflare-pages deploy*
---
*Observed: 2026-08-05T04:45:36.874Z*