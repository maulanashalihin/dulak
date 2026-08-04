/**
 * Profile routes at /profile — page render and avatar updates.
 * Avatar bytes are uploaded through the tus protocol at /uploads (see
 * uploads.routes.ts), then linked to the user by upload id here.
 */
import { Elysia, t, type Static } from "elysia";
import { requireAuth } from "../auth";
import { findUpload, updateUserAvatar } from "../db";
import {
	inertiaPlugin,
	makePopulateStore,
	type InertiaStore,
} from "../inertia-plugin";
import type { InertiaAssets } from "../inertia";

const avatarBody = t.Object({
	uploadId: t.String({ minLength: 1 }),
});
type AvatarBody = Static<typeof avatarBody>;

export const profileRoutes = (assets: InertiaAssets) =>
	new Elysia()
		.use(inertiaPlugin(assets))
		.onBeforeHandle(makePopulateStore(assets))
		.get("/profile", ({ store }) => store.inertia.render("Profile", {}), {
			beforeHandle: requireAuth,
		})
		.post(
			"/profile/avatar",
			({ body, store }: { body: AvatarBody; store: InertiaStore }) => {
				const user = store.user;
				if (!user) return new Response("Unauthorized", { status: 401 });
				const upload = findUpload.get(body.uploadId);
				if (!upload || upload.userId !== user.id) {
					return new Response("Upload not found", { status: 404 });
				}
				if (upload.offset < upload.uploadLength) {
					return new Response("Upload is not complete", { status: 400 });
				}
				let filetype = "";
				try {
					const meta = JSON.parse(upload.metadata) as Record<string, string>;
					filetype = typeof meta.filetype === "string" ? meta.filetype : "";
				} catch {
					/* metadata may be empty or malformed */
				}
				if (!filetype.startsWith("image/")) {
					return new Response("Only image uploads can be used as an avatar", {
						status: 422,
					});
				}
				updateUserAvatar.run(`/uploads/${upload.id}`, user.id);
				return new Response(null, { status: 204 });
			},
			{ body: avatarBody, beforeHandle: requireAuth },
		);
