---
type: source
title: "Boilerplate v0.1.0 released + PAT workflow-scope gotcha"
slug: boilerplate-v010-released-and-pat-workflow-scope
status: insight
created: 2026-08-03
updated: 2026-08-03
category: project
---
# Boilerplate v0.1.0 released + PAT workflow-scope gotcha
Milestone 2026-08-03: [[entities/elysia-inertia-boilerplate]] v0.1.0 dirilis ke public GitHub (maulanashalihin/elysia-inertia-boilerplate), dengan MIT license, README badges, package metadata, dan GitHub release. Status akhir: 20/20 test, tsc bersih, CI pipeline siap (`.github/workflows/ci.yml` ada di lokal).

**Gotcha:** push file `.github/workflows/*` pakai classic PAT ditolak GitHub dengan 'refusing to allow a Personal Access Token to create or update workflow ... without `workflow` scope'. PAT harus punya scope `workflow` untuk meng-upload workflow files (via git push ATAU API contents). Solusi: rotasi token sekalian tambah scope workflow (token lama memang harus dirotasi karena pernah terpajang di chat).

Keputusan terkunci sebelumnya: vanilla CSS final ([[sources/obs-2026-08-03-styling-decision-vanilla-css-final]]), Elysia 1.4.29 sampai 2.0 stable ([[sources/elysia-2-vs-14-differences]]).
*Category: project*
---
*Captured: 2026-08-03*
## Related
_Add links to related pages._