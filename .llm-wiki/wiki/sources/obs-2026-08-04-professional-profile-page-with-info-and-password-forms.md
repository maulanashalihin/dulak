---
type: source
title: "Observation: Professional profile page with info and password forms"
slug: obs-2026-08-04-professional-profile-page-with-info-and-password-forms
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: high
observed_at: 2026-08-04T05:54:57.628Z
tags: ["dulak", "profile", "forms", "password", "sessions"]
source_context: "Professional profile page"
---
# ⭐ Observation: Professional profile page with info and password forms
/profile upgraded to a professional two-column page: avatar card (tus upload, role badge, member since) + Profile information form (PATCH /profile: name/email with duplicate-email check -> 422 field error) + Change password form (POST /profile/password: verify current password, then updateUserPassword + deleteOtherSessionsByToken — other devices invalidated, current session stays). Validation errors map through COMPONENT_BY_PATH (/profile, /profile/password -> Profile) with PROFILE_VALIDATION_MESSAGES merged into VALIDATION_MESSAGES_ALL in app.ts. Client uses Inertia useForm (patch/post, clearErrors, processing). 57 E2E tests green; browser-verified (update name via PATCH reflects in UI + DB).
*Relevance: high*

*Context: Professional profile page*

*Tags: dulak profile forms password sessions*
---
*Observed: 2026-08-04T05:54:57.628Z*