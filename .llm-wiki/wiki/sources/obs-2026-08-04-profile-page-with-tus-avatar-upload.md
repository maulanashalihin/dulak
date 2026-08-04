---
type: source
title: "Observation: Profile page with tus avatar upload"
slug: obs-2026-08-04-profile-page-with-tus-avatar-upload
status: observation
created: 2026-08-04
updated: 2026-08-04
relevance: high
observed_at: 2026-08-04T04:26:16.782Z
tags: ["dulak", "tus", "avatar", "profile", "upload"]
source_context: "Building profile avatar upload on tus"
---
# ⭐ Observation: Profile page with tus avatar upload
Tus upload infra now earns its keep: /profile page (routes/profile.routes.ts, GET render + POST /profile/avatar) lets users upload an avatar via a hand-rolled zero-dep tus client (create -> 256KB chunked PATCH -> HEAD-reconciled resume, progress bar, localStorage pending-upload key 'dulak:avatar:upload'). Avatar linked by upload id after validating ownership (row.userId), completion (offset >= uploadLength), and image/* content-type from Upload-Metadata; sets users.avatar_url = /uploads/<id>. Added GET /uploads/:id as a tus protocol extension serving stored bytes (content-type from metadata, private max-age=86400, 128-bit ids = effectively unguessable). PublicUser/toPublicUser now expose avatarUrl; sidebar Profile item + avatar <img> in user menu. 52 E2E tests green; verified in browser end to end.
*Relevance: high*

*Context: Building profile avatar upload on tus*

*Tags: dulak tus avatar profile upload*
---
*Observed: 2026-08-04T04:26:16.782Z*