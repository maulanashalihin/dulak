/**
 * CDN cache middleware for Cloudflare edge caching.
 *
 * Two modes:
 *  - `cacheablePublic(sMaxAge, swr)` — for public pages whose HTML is
 *    identical for all visitors (no auth.user in Inertia props). Sets
 *    `Cache-Control: public, s-maxage=N, stale-while-revalidate=M` on
 *    200 HTML responses (browser visits only — Inertia XHR is excluded).
 *  - `noStore` — for auth pages and /api/* endpoints that return
 *    user-specific data. Sets `Cache-Control: private, no-store`.
 *
 * ## Public page pattern
 *
 * Public pages must render with `{ public: true }` in the Inertia adapter
 * so `auth.user` and `flash` are excluded from the page props. This makes
 * the HTML user-agnostic → CF can cache it. The client fetches user
 * identity separately via `GET /api/session` after hydration.
 *
 * ```ts
 * import { cacheablePublic } from "../cache";
 *
 * app.use("*", cacheablePublic(300, 600)); // 5 min TTL, 10 min SWR
 * app.get("/", (c) =>
 *   c.var.inertia.render("Home", { title: "Welcome" }, { public: true }),
 * );
 * ```
 *
 * ## SPA cache-key separation
 *
 * Inertia XHR navigations carry `X-Inertia: true` and are excluded from
 * the public cache header. The client also appends `?_spa=1` to XHR URLs
 * (see `app.tsx`) so CF caches JSON and HTML under separate keys.
 */
import type { Next } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "./inertia-middleware";

/**
 * Set `Cache-Control: public, s-maxage=N, stale-while-revalidate=M` on
 * successful HTML responses (status 200, non-XHR). Inertia XHR responses
 * are skipped — they are small and cached separately via the `_spa` query
 * param the client adds.
 */
export const cacheablePublic =
	(sMaxAge: number, swr: number) =>
	async (c: Context<AppEnv>, next: Next) => {
		await next();
		if (c.res.status === 200 && !c.req.header("x-inertia")) {
			c.res.headers.set(
				"Cache-Control",
				`public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
			);
		}
	};

/**
 * Set `Cache-Control: private, no-store` on all responses. Use on auth
 * pages and /api/* endpoints that return user-specific data.
 */
export const noStore = async (c: Context<AppEnv>, next: Next) => {
	await next();
	c.res.headers.set("Cache-Control", "private, no-store");
};
