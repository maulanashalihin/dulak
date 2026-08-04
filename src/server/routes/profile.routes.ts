/**
 * Profile routes at /profile — page render, avatar uploads, profile info and
 * password changes. Avatar bytes travel through the tus protocol at /uploads
 * (see uploads.routes.ts), then are linked to the user by upload id here.
 */
import { Elysia, t, type Static } from "elysia";
import {
	deleteOtherSessionsByToken,
	hashPassword,
	requireAuth,
	setFlash,
	verifyPassword,
} from "../auth";
import {
	findUpload,
	findUserByEmail,
	findUserById,
	updateUserAvatar,
	updateUserPassword,
	updateUserProfile,
} from "../db";
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
const infoBody = t.Object({
	name: t.String({ minLength: 2, maxLength: 80 }),
	email: t.String({ format: "email" }),
});
const passwordBody = t.Object({
	currentPassword: t.String({ minLength: 1 }),
	password: t.String({ minLength: 8, maxLength: 72 }),
	passwordConfirmation: t.String({ minLength: 1 }),
});
type InfoBody = Static<typeof infoBody>;
type PasswordBody = Static<typeof passwordBody>;

/** Field messages for the profile forms (merged into VALIDATION_MESSAGES in app.ts). */
export const PROFILE_VALIDATION_MESSAGES: Record<string, string> = {
	"/name": "Name must be at least 2 characters.",
	"/currentPassword": "Enter your current password.",
	"/passwordConfirmation": "Confirm your password.",
};

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
		)
		.patch(
			"/profile",
			({ body, store }: { body: InfoBody; store: InertiaStore }) => {
				const user = store.user;
				if (!user) return new Response("Unauthorized", { status: 401 });
				const existing = findUserByEmail.get(body.email);
				if (existing && existing.id !== user.id) {
					return store.inertia.error("Profile", {
						email: "That email is already registered.",
					});
				}
				updateUserProfile.run(body.name, body.email, user.id);
				if (store.sessionToken)
					setFlash(store.sessionToken, { success: "Profile updated." });
				return store.inertia.redirect("/profile");
			},
			{ body: infoBody, beforeHandle: requireAuth },
		)
		.post(
			"/profile/password",
			async ({ body, store }: { body: PasswordBody; store: InertiaStore }) => {
				const user = store.user;
				if (!user) return new Response("Unauthorized", { status: 401 });
				if (body.password !== body.passwordConfirmation) {
					return store.inertia.error("Profile", {
						password: "Password confirmation does not match.",
					});
				}
				const full = findUserById.get(user.id);
				if (!full) return new Response("Unauthorized", { status: 401 });
				if (!(await verifyPassword(body.currentPassword, full.passwordHash))) {
					return store.inertia.error("Profile", {
						currentPassword: "Your current password is incorrect.",
					});
				}
				const passwordHash = await hashPassword(body.password);
				updateUserPassword.run(passwordHash, user.id);
				if (store.sessionToken) {
					deleteOtherSessionsByToken(store.sessionToken, user.id);
					setFlash(store.sessionToken, { success: "Password updated." });
				}
				return store.inertia.redirect("/profile");
			},
			{ body: passwordBody, beforeHandle: requireAuth },
		);
