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
 * the public cache header. Their JSON is version-keyed (`?v=`, see
 * inertia.ts): cacheable only when the key matches this exact version.
 */
import type { Next } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "./inertia-middleware";

/**
 * Set `Cache-Control: public, max-age=0, s-maxage=N, stale-while-revalidate=M`
 * on successful HTML responses (status 200, non-XHR). max-age=0 forces
 * browsers to revalidate every load (a plain reload always shows fresh HTML)
 * while the edge still serves from cache via s-maxage. Inertia XHR responses
 * set their own header in inertia.ts (version-keyed when `?v` matches).
 */
export const cacheablePublic =
	(sMaxAge: number, swr: number) =>
	async (c: Context<AppEnv>, next: Next) => {
		await next();
		if (c.res.status === 200 && !c.req.header("x-inertia")) {
			c.res.headers.set(
				"Cache-Control",
				`public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
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

/**
 * Canonicalize `?_spa=1` (and version-key `?v=`) browser document loads
 * back to the clean URL. The client sends both on every XHR, but a stray
 * param on a document load must never render: it would leak into page.url
 * and the address bar. XHR itself (which carries `x-inertia`) is untouched
 * and still returns JSON. Mount globally, before routes.
 */
export const stripSpaParam = async (c: Context<AppEnv>, next: Next) => {
	if (
		c.req.method === "GET" &&
		!c.req.header("x-inertia") &&
		(c.req.query("_spa") !== undefined || c.req.query("v") !== undefined)
	) {
		let pathname: string;
		let search: string;
		try {
			const url = new URL(c.req.url);
			url.searchParams.delete("_spa");
			url.searchParams.delete("v");
			pathname = url.pathname;
			search = url.searchParams.toString();
		} catch {
			return next();
		}
		return c.redirect(`${pathname}${search ? `?${search}` : ""}`, 302);
	}
	await next();
};
