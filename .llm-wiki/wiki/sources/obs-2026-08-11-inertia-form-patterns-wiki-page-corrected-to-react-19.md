---
type: source
title: "Observation: Inertia form patterns wiki page corrected to React 19"
slug: obs-2026-08-11-inertia-form-patterns-wiki-page-corrected-to-react-19
status: observation
created: 2026-08-11
updated: 2026-08-11
relevance: high
observed_at: 2026-08-11T12:58:50.184Z
tags: ["inertia", "react", "wiki", "forms"]
source_context: "Memperbaiki wiki page agar sesuai stack repo (React 19, bukan Svelte 5)"
---
# ⭐ Observation: Inertia form patterns wiki page corrected to React 19
concept-inertia-form-patterns.md awalnya ditulis untuk Svelte 5 (proyek 'Laju Go') dengan sintaks bind:value, {#snippet}, {#if}, onsubmit. Rewrite 2026-08-11 ke React 19 + @inertiajs/react agar cocok dulak-v2. Konsep Inertia v3 (Form component vs useForm, remember-key, processing/errors, file upload two-step) tetap valid lintas adapter — hanya sintaks binding berbeda. dulak-v2 memakai useForm + <form> di semua halaman (Login, Register, ResetPassword, ForgotPassword, Profile). Avatar upload memakai tus protocol (bukan fetch+FormData sederhana) — lihat src/client/pages/Profile.tsx runUpload.
*Relevance: high*

*Context: Memperbaiki wiki page agar sesuai stack repo (React 19, bukan Svelte 5)*

*Tags: inertia react wiki forms*
---
*Observed: 2026-08-11T12:58:50.184Z*