/**
 * Auth: argon2id password hashing (Bun.password), DB-backed sessions,
 * httpOnly cookie helpers, flash messages, password-reset tokens,
 * Google OAuth state, and route guards (requireAuth / guestOnly / requireRole).
 *
 * Guards are Hono middleware: they return a Response to short-circuit the
 * chain, or `next()` to continue.
 */
import { createHash, randomBytes } from "node:crypto";
import type { Context, Next } from "hono";
import { generateCookie } from "hono/cookie";
import type { FlashData, Role } from "../shared/types";
import {
	deleteOtherSessions,
	deletePasswordResetsByEmail,
	deleteSession,
	findPasswordReset,
	findSession,
	findUserById,
	insertPasswordReset,
	insertSession,
	updateSessionFlash,
	type UserRow,
} from "./db";
import type { AppEnv } from "./inertia-middleware";
import { safeUrl } from "./url";

export const SESSION_COOKIE = "session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Passwords (argon2id — OWASP-recommended)
// ---------------------------------------------------------------------------

export const hashPassword = (password: string) =>
	Bun.password.hash(password, {
		algorithm: "argon2id",
		memoryCost: 19456,
		timeCost: 2,
	});

export const verifyPassword = (password: string, hash: string) =>
	Bun.password.verify(password, hash);

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface SessionInfo {
	token: string;
	expiresAt: Date;
}

/** 256-bit random token; it is never logged and only lives in the cookie.
 *  The DB stores only its SHA-256 hash so a DB leak cannot expose valid tokens. */
export function createSession(userId: number): SessionInfo {
	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	insertSession.run(hashToken(token), userId, expiresAt.toISOString());
	return { token, expiresAt };
}

export function resolveUser(token: string | null | undefined): UserRow | null {
	if (!token) return null;
	const session = findSession.get(hashToken(token));
	if (!session) return null;
	if (Date.now() > new Date(session.expiresAt).getTime()) {
		deleteSessionByToken(token); // lazy cleanup of expired sessions
		return null;
	}
	return findUserById.get(session.userId) ?? null;
}

/** Delete a session by its raw (cookie) token — hashes before hitting the DB. */
export function deleteSessionByToken(token: string): void {
	deleteSession.run(hashToken(token));
}

/** Delete every session for `userId` except the one owning `token` (password
 *  changes invalidate other devices; the current session stays signed in). */
export function deleteOtherSessionsByToken(
	token: string,
	userId: number,
): void {
	deleteOtherSessions.run(userId, hashToken(token));
}

// ---------------------------------------------------------------------------
// Flash messages (one-shot, stored on the session row; consumed on render)
// ---------------------------------------------------------------------------

export function readFlash(token: string | null | undefined): FlashData {
	if (!token) return {};
	const session = findSession.get(hashToken(token));
	if (!session) return {};
	try {
		const parsed: unknown = JSON.parse(session.flash);
		return parsed && typeof parsed === "object" ? (parsed as FlashData) : {};
	} catch {
		return {};
	}
}

export function setFlash(token: string, flash: FlashData): void {
	updateSessionFlash.run(JSON.stringify(flash), hashToken(token));
}

export function clearFlash(token: string | null | undefined): void {
	if (token) updateSessionFlash.run("{}", hashToken(token));
}

// ---------------------------------------------------------------------------
// Password reset tokens (hashed at rest; the raw token goes in the email)
// ---------------------------------------------------------------------------

export const hashToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");

/** Create a reset token for `email` and return the raw token to email out. */
export function createPasswordReset(email: string): string {
	const token = randomBytes(32).toString("hex");
	insertPasswordReset.run(
		email,
		hashToken(token),
		new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
	);
	return token;
}

/** Verify a raw reset token for `email` (consumes nothing; caller deletes). */
export function verifyPasswordReset(email: string, token: string): boolean {
	const row = findPasswordReset.get(hashToken(token));
	if (!row || row.email.toLowerCase() !== email.toLowerCase()) return false;
	return Date.now() <= new Date(row.expiresAt).getTime();
}

export function clearPasswordResets(email: string): void {
	deletePasswordResetsByEmail.run(email);
}

// ---------------------------------------------------------------------------
// Cookies (hono/cookie helpers — set on the Hono context)
//
// Note: the Inertia adapter returns plain `Response` objects, and Hono drops
// headers queued via `c.header()`/`setCookie()` when a handler returns a
// custom Response. Appending the serialized cookie to `c.res.headers`
// instead works because the `context.res` setter merges `c.res` headers
// (including Set-Cookie) into the handler-returned response.
// ---------------------------------------------------------------------------

export function setSessionCookie(
	c: Context<AppEnv>,
	token: string,
	expiresAt: Date,
): void {
	c.res.headers.append(
		"set-cookie",
		generateCookie(SESSION_COOKIE, token, {
			httpOnly: true,
			sameSite: "Lax", // blocks cross-site POSTs (CSRF baseline, see security.ts)
			secure: isProd,
			path: "/",
			maxAge: SESSION_TTL_MS / 1000,
			expires: expiresAt,
		}),
	);
}

export function clearSessionCookie(c: Context<AppEnv>): void {
	c.res.headers.append(
		"set-cookie",
		generateCookie(SESSION_COOKIE, "", {
			httpOnly: true,
			sameSite: "Lax",
			secure: isProd,
			path: "/",
			maxAge: 0,
		}),
	);
}

export const OAUTH_STATE_COOKIE = "oauth_state";

/** Short-lived state cookie protecting the OAuth callback from CSRF. */
export function setOAuthStateCookie(c: Context<AppEnv>, state: string): void {
	c.res.headers.append(
		"set-cookie",
		generateCookie(OAUTH_STATE_COOKIE, state, {
			httpOnly: true,
			sameSite: "Lax",
			secure: isProd,
			path: "/",
			maxAge: 600, // 10 minutes
		}),
	);
}

export function clearOAuthStateCookie(c: Context<AppEnv>): void {
	c.res.headers.append(
		"set-cookie",
		generateCookie(OAUTH_STATE_COOKIE, "", {
			httpOnly: true,
			sameSite: "Lax",
			secure: isProd,
			path: "/",
			maxAge: 0,
		}),
	);
}

// ---------------------------------------------------------------------------
// Route guards (Hono middleware: Response short-circuits, next() continues)
// ---------------------------------------------------------------------------

const redirectTo = (request: Request, path: string) =>
	Response.redirect(new URL(path, safeUrl(request.url).toString()).toString());

export const requireAuth = async (c: Context<AppEnv>, next: Next) => {
	if (!c.var.user) return redirectTo(c.req.raw, "/login");
	return next();
};

export const guestOnly = async (c: Context<AppEnv>, next: Next) => {
	if (c.var.user) return redirectTo(c.req.raw, "/dashboard");
	return next();
};

/** Guard factory: e.g. `requireRole('admin')` — non-admins go to /dashboard. */
export const requireRole =
	(...roles: Role[]) =>
	async (c: Context<AppEnv>, next: Next) => {
		if (!c.var.user) return redirectTo(c.req.raw, "/login");
		if (!roles.includes(c.var.user.role))
			return redirectTo(c.req.raw, "/dashboard");
		return next();
	};
