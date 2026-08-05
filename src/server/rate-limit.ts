/**
 * Minimal in-memory fixed-window rate limiter — zero dependencies.
 * Registered on the auth routes; Hono middleware MUST call `next()` to
 * continue the chain (unlike Elysia beforeHandle, where returning undefined
 * continued).
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

export function rateLimit({ max, windowSeconds }: RateLimitOptions) {
	const buckets = new Map<string, Bucket>();

	return async (c: Context<AppEnv>, next: Next) => {
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
				resetAt: now + windowSeconds * 1000,
			});
			return next();
		}

		bucket.count += 1;
		if (bucket.count > max) {
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
