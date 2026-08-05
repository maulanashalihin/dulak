/**
 * Security middleware (registered on the app instance in app.ts):
 *  - checkOrigin: CSRF defense — SameSite=Lax cookie + Origin check on
 *    unsafe methods (non-browser clients that omit Origin are allowed).
 *  - Hardening headers come from Hono's `secureHeaders` middleware (see
 *    app.ts); the hand-rolled header set from the Elysia era is gone.
 *
 * Hono's built-in `csrf()` middleware was evaluated and rejected: it blocks
 * unsafe requests whenever the Origin header is missing (for form
 * content-types), which breaks non-browser clients and this app's contract.
 */
import type { Context, Next } from "hono";
import type { AppEnv } from "./inertia-middleware";
import { safeUrl } from "./url";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const checkOrigin = async (c: Context<AppEnv>, next: Next) => {
	if (UNSAFE_METHODS.has(c.req.raw.method)) {
		const origin = c.req.raw.headers.get("origin");
		if (origin) {
			// A malformed Origin is treated as cross-origin (suspicious).
			const originHost = safeUrl(origin).host;
			const requestHost = safeUrl(c.req.raw.url).host;
			if (originHost !== requestHost) {
				return new Response("Cross-origin requests are not allowed", {
					status: 403,
				});
			}
		}
	}
	return next();
};
