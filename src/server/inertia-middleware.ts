/**
 * Inertia middleware: resolves the session per request and exposes the
 * Inertia adapter as a typed context variable (Hono `Variables`).
 *
 * Registered once on the app instance. Unlike Elysia 1.4 (where plugins
 * without routes dropped their hooks and store population had to be
 * re-registered per route instance), Hono middleware attached with
 * `app.use()` runs for every request — including unmatched routes — so the
 * not-found/error handlers can rely on `c.var.inertia` being populated.
 */
import type { Next } from "hono";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import type { FlashData, User } from "../shared/types";
import { readFlash, resolveUser, SESSION_COOKIE } from "./auth";
import { toPublicUser } from "./db";
import { Inertia, type InertiaAssets } from "./inertia";

/** Context variables shared by every route/middleware. */
export interface AppEnv {
	Variables: {
		user: User | null;
		flash: FlashData;
		sessionToken: string | null;
		inertia: Inertia;
		requestId: string;
	};
}

export const inertiaMiddleware =
	(assets: InertiaAssets) => async (c: Context<AppEnv>, next: Next) => {
		const raw = getCookie(c, SESSION_COOKIE);
		const sessionToken = typeof raw === "string" && raw.length > 0 ? raw : null;
		const row = resolveUser(sessionToken);
		const user = row ? toPublicUser(row) : null;
		const flash = readFlash(sessionToken);
		c.set("user", user);
		c.set("flash", flash);
		c.set("sessionToken", sessionToken);
		c.set(
			"inertia",
			new Inertia(
				{
					request: c.req.raw,
					headers: Object.fromEntries(c.req.raw.headers.entries()),
					user,
					flash,
					sessionToken,
				},
				assets,
			),
		);
		await next();
	};
