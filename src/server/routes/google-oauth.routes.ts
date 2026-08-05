/**
 * Google OAuth (register-or-login). Zero-dependency: plain fetch against
 * Google's endpoints, with a short-lived state cookie for CSRF protection.
 * Disabled automatically when GOOGLE_CLIENT_ID/SECRET are not configured.
 */
import { randomBytes } from "node:crypto";
import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import {
	clearOAuthStateCookie,
	createSession,
	OAUTH_STATE_COOKIE,
	setOAuthStateCookie,
	setSessionCookie,
} from "../auth";
import { config } from "../config";
import {
	createGoogleUser,
	findUserByEmail,
	findUserByGoogleId,
	insertUpload,
	linkGoogleAccount,
	updateUserAvatar,
	type UserRow,
} from "../db";
import type { AppEnv } from "../inertia-middleware";
import { generateUploadId } from "../tus-protocol";
import { uploadPath, writeBytes } from "../tus-storage";
import { safeUrl } from "../url";

interface GoogleProfile {
	id: string;
	email: string;
	name: string;
	picture: string | null;
}

async function exchangeCode(code: string): Promise<string> {
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: config.google.clientId!,
			client_secret: config.google.clientSecret!,
			redirect_uri: `${config.appUrl}/auth/google/callback`,
			grant_type: "authorization_code",
		}),
	});
	if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
	const data = (await res.json()) as { access_token?: string };
	if (!data.access_token)
		throw new Error("Google token exchange returned no access token");
	return data.access_token;
}

async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
	const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
		headers: { authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) throw new Error(`Google profile fetch failed (${res.status})`);
	const data = (await res.json()) as {
		id?: string;
		email?: string;
		name?: string;
		picture?: string;
	};
	if (!data.id || !data.email)
		throw new Error("Google profile is missing id/email");
	return {
		id: data.id,
		email: data.email.toLowerCase(),
		name: data.name?.trim() || data.email.split("@")[0]!,
		picture: data.picture ?? null,
	};
}

/** Download the Google profile picture and store a local copy in the uploads
 *  store. The CSP (img-src 'self') blocks external images, so avatars must
 *  live on our own origin; returns the local URL (/uploads/<id>). */
async function storeGoogleAvatar(
	pictureUrl: string,
	userId: number,
): Promise<string> {
	const res = await fetch(pictureUrl);
	if (!res.ok) throw new Error(`Avatar download failed (${res.status})`);
	const bytes = new Uint8Array(await res.arrayBuffer());
	const id = generateUploadId();
	const filetype =
		res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
	await writeBytes(id, bytes);
	insertUpload.run(
		id,
		bytes.byteLength,
		JSON.stringify({ filetype }),
		userId,
		uploadPath(id),
		null,
	);
	return `/uploads/${id}`;
}

/** Find or create a local user for the Google profile (links by email). */
async function findOrCreateGoogleUser(
	profile: GoogleProfile,
): Promise<UserRow> {
	const byGoogle = findUserByGoogleId.get(profile.id);
	if (byGoogle) return byGoogle;

	const byEmail = findUserByEmail.get(profile.email);
	if (byEmail) {
		if (byEmail.googleId && byEmail.googleId !== profile.id) {
			throw new Error("Email is already linked to a different Google account");
		}
		linkGoogleAccount.run(profile.id, byEmail.id);
		return byEmail;
	}

	const created = createGoogleUser.get(
		profile.name,
		profile.email,
		profile.id,
		profile.picture ?? "",
	);
	if (!created) throw new Error("Failed to create user from Google profile");
	return findUserByEmail.get(profile.email)!; // created above
}

export const googleOauthRoutes = () => {
	const app = new Hono<AppEnv>();

	app.get("/auth/google", (c) => {
		if (!config.google.clientId || !config.google.clientSecret) {
			return new Response("Google OAuth is not configured", { status: 400 });
		}
		const state = randomBytes(16).toString("hex");
		setOAuthStateCookie(c, state);
		const params = new URLSearchParams({
			client_id: config.google.clientId,
			redirect_uri: `${config.appUrl}/auth/google/callback`,
			response_type: "code",
			scope: "openid email profile",
			state,
			prompt: "select_account",
		});
		return Response.redirect(
			`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
		);
	});

	app.get("/auth/google/callback", async (c) => {
		const url = safeUrl(c.req.url);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		const stored = getCookie(c, OAUTH_STATE_COOKIE) ?? null;
		clearOAuthStateCookie(c);

		if (
			url.searchParams.get("error") ||
			!code ||
			!state ||
			!stored ||
			state !== stored
		) {
			return Response.redirect(
				new URL("/login?notice=google_failed", url).toString(),
			);
		}
		try {
			const accessToken = await exchangeCode(code);
			const profile = await fetchProfile(accessToken);
			const user = await findOrCreateGoogleUser(profile);
			// Store a local copy of the Google picture (CSP blocks external
			// images); also upgrades legacy external avatar URLs on re-login.
			if (profile.picture && !user.avatarUrl?.startsWith("/uploads/")) {
				try {
					const avatarUrl = await storeGoogleAvatar(profile.picture, user.id);
					updateUserAvatar.run(avatarUrl, user.id);
				} catch (err) {
					console.error("[google-oauth] avatar download failed:", err);
				}
			}
			const session = createSession(user.id);
			setSessionCookie(c, session.token, session.expiresAt);
			return Response.redirect(new URL("/dashboard", url).toString());
		} catch (err) {
			console.error("[google-oauth]", err);
			return Response.redirect(
				new URL("/login?notice=google_failed", url).toString(),
			);
		}
	});

	return app;
};
