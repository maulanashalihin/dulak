/**
 * Minimal in-memory fixed-window rate limiter — zero dependencies.
 * Two layers: a global limiter in app.ts (DDoS baseline, excludes /health
 * and /assets/*) and a stricter one on auth routes (brute-force protection).
 * Hono middleware MUST call `next()` to continue the chain.
 *
 * Notes:
 *  - Per-process memory; fine for a single instance. For horizontal scaling
 *    swap this for a shared store (Redis) behind the same hook signature.
 *  - Client key: X-Forwarded-For first entry, else the peer IP (via the Bun
 *    server Bun passes as the 2nd fetch arg → `c.env`), else 'local'.
 *    Trust X-Forwarded-For only behind a proxy that sets it.
 *  - Why not hono-rate-limiter: its keyGenerator story leans on
 *    `hono/conninfo`, whose ESM build is an empty stub in hono 4.13. The
 *    hand-rolled version keeps the exact semantics with zero deps.
 */
import type { Server } from "bun";
import type { Context, Next } from "hono";
import type { AppEnv } from "./inertia-middleware";

export interface RateLimitOptions {
	max: number;
	windowSeconds: number;
	/**
	 * When set, only paths in this list are counted/enforced. Required for
	 * limiters mounted on Hono sub-apps: `app.route("/", subApp)` runs the
	 * sub-app's `app.use()` middleware for EVERY path under the mount point,
	 * so without a path filter an "auth" limiter also throttles unrelated
	 * pages (/, /dashboard, …). Verified bug 2026-08-10 — 30 page loads per
	 * minute per IP returned 429 site-wide.
	 */
	paths?: string[];
}

interface Bucket {
	count: number;
	resetAt: number;
}

const MAX_BUCKETS = 10_000;

type BunServer = Server<any>;

function clientKey(request: Request, server: BunServer | null): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0]!.trim();
	const ip = server?.requestIP?.(request)?.address;
	return ip ?? "local";
}

export function rateLimit(opts: RateLimitOptions) {
	const buckets = new Map<string, Bucket>();

	return async (c: Context<AppEnv>, next: Next) => {
		// Path filter — only enforce for the configured paths (see RateLimitOptions).
		if (opts.paths) {
			const pathname = new URL(c.req.url).pathname;
			if (!opts.paths.includes(pathname)) return next();
		}
		const now = Date.now();
		const key = clientKey(
			c.req.raw,
			(c.env as unknown as BunServer | undefined) ?? null,
		);

		// Opportunistic pruning so the map cannot grow unbounded.
		if (buckets.size > MAX_BUCKETS) {
			for (const [k, bucket] of buckets) {
				if (bucket.resetAt <= now) buckets.delete(k);
			}
		}

		const bucket = buckets.get(key);
		if (!bucket || bucket.resetAt <= now) {
			buckets.set(key, {
				count: 1,
				resetAt: now + opts.windowSeconds * 1000,
			});
			return next();
		}

		bucket.count += 1;
		if (bucket.count > opts.max) {
			return new Response("Too many attempts. Please try again later.", {
				status: 429,
				headers: {
					"retry-after": String(
						Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
					),
				},
			});
		}
		return next();
	};
}
