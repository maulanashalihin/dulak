/**
 * Profile routes at /profile — page render, avatar uploads, profile info and
 * password changes.
 *
 * Two upload protocols coexist in this boilerplate:
 *  - Regular upload (multipart/form-data) — for files ≤ 100 MB. Avatar
 *    uploads use this path: the image is decoded, resized and re-encoded to
 *    WebP with Bun.image (Bun 1.4) before being stored, so avatars are always
 *    small, raster, and served from our own origin.
 *  - tus protocol at /uploads (see uploads.routes.ts) — resumable chunked
 *    uploads for files > 100 MB where a plain multipart request would be
 *    unreliable.
 */
import { Type as t, type Static } from "@sinclair/typebox";
import { Image } from "bun";
import { Hono } from "hono";
import {
	deleteOtherSessionsByToken,
	hashPassword,
	requireAuth,
	setFlash,
	verifyPassword,
} from "../auth";
import {
	findUserByEmail,
	findUserById,
	insertUpload,
	updateUserAvatar,
	updateUserPassword,
	updateUserProfile,
} from "../db";
import { generateUploadId } from "../tus-protocol";
import { uploadPath, writeBytes } from "../tus-storage";
import type { AppEnv } from "../inertia-middleware";
import { validateJson } from "../validation";

const infoBody = t.Object(
	{
		name: t.String({ minLength: 2, maxLength: 80 }),
		email: t.String({ format: "email" }),
	},
	{ additionalProperties: false },
);
const passwordBody = t.Object(
	{
		currentPassword: t.String({ minLength: 1 }),
		password: t.String({ minLength: 8, maxLength: 72 }),
		passwordConfirmation: t.String({ minLength: 1 }),
	},
	{ additionalProperties: false },
);

type InfoBody = Static<typeof infoBody>;
type PasswordBody = Static<typeof passwordBody>;

/** Field messages for the profile forms (merged into VALIDATION_MESSAGES in app.ts). */
export const PROFILE_VALIDATION_MESSAGES: Record<string, string> = {
	"/name": "Name must be at least 2 characters.",
	"/currentPassword": "Enter your current password.",
	"/passwordConfirmation": "Confirm your password.",
};

export const profileRoutes = () => {
	const app = new Hono<AppEnv>();

	app.get("/profile", requireAuth, (c) => c.var.inertia.render("Profile", {}));

	app.post("/profile/avatar", requireAuth, async (c) => {
		const user = c.var.user;
		if (!user) return new Response("Unauthorized", { status: 401 });

		let form: FormData;
		try {
			form = await c.req.formData();
		} catch {
			return new Response("Malformed multipart request", { status: 400 });
		}
		const file = form.get("avatar");
		if (!(file instanceof Blob)) {
			return new Response("No file uploaded", { status: 422 });
		}

		// Raster-only: SVG can carry inline scripts — keeping avatars raster
		// avoids serving attacker-controlled scripts from our origin. Bun.image
		// sniffs the real format from bytes (ignoring Content-Type), so a
		// mismatched declared type is caught at decode below.
		const AVATAR_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
		if (!AVATAR_TYPES.includes(file.type)) {
			return new Response("Only PNG, JPEG, GIF, or WebP images are allowed", {
				status: 422,
			});
		}
		// 10 MB raw cap — the stored WebP is far smaller after resize.
		if (file.size > 10 * 1024 * 1024) {
			return new Response("Avatar image must be under 10 MB", { status: 413 });
		}

		// Decode → resize → re-encode to WebP with Bun.image (Bun 1.4).
		// fit:"inside" preserves aspect ratio within 256×256; autoOrient
		// applies EXIF rotation for phone photos.
		let out: Uint8Array;
		try {
			const bytes = new Uint8Array(await file.arrayBuffer());
			out = await new Image(bytes, {
				maxPixels: 4096 * 4096,
				autoOrient: true,
			})
				.resize(256, 256, { fit: "inside" })
				.webp({ quality: 80 })
				.bytes();
		} catch {
			return new Response("Could not decode the image", { status: 422 });
		}
		const id = generateUploadId();
		await writeBytes(id, out);
		insertUpload.run(
			id,
			out.byteLength,
			JSON.stringify({ filetype: "image/webp" }),
			user.id,
			uploadPath(id),
			null,
		);
		updateUserAvatar.run(`/uploads/${id}`, user.id);
		return new Response(null, { status: 204 });
	});

	app.patch("/profile", requireAuth, validateJson(infoBody), (c) => {
		const user = c.var.user;
		if (!user) return new Response("Unauthorized", { status: 401 });
		const body = c.req.valid("json") as InfoBody;
		const existing = findUserByEmail.get(body.email);
		if (existing && existing.id !== user.id) {
			return c.var.inertia.error("Profile", {
				email: "That email is already registered.",
			});
		}
		updateUserProfile.run(body.name, body.email, user.id);
		if (c.var.sessionToken)
			setFlash(c.var.sessionToken, { success: "Profile updated." });
		return c.var.inertia.redirect("/profile");
	});

	app.post(
		"/profile/password",
		requireAuth,
		validateJson(passwordBody),
		async (c) => {
			const user = c.var.user;
			if (!user) return new Response("Unauthorized", { status: 401 });
			const body = c.req.valid("json") as PasswordBody;
			if (body.password !== body.passwordConfirmation) {
				return c.var.inertia.error("Profile", {
					password: "Password confirmation does not match.",
				});
			}
			const full = findUserById.get(user.id);
			if (!full) return new Response("Unauthorized", { status: 401 });
			if (!(await verifyPassword(body.currentPassword, full.passwordHash))) {
				return c.var.inertia.error("Profile", {
					currentPassword: "Your current password is incorrect.",
				});
			}
			const passwordHash = await hashPassword(body.password);
			updateUserPassword.run(passwordHash, user.id);
			if (c.var.sessionToken) {
				deleteOtherSessionsByToken(c.var.sessionToken, user.id);
				setFlash(c.var.sessionToken, { success: "Password updated." });
			}
			return c.var.inertia.redirect("/profile");
		},
	);

	return app;
};
