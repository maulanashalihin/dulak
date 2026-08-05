/**
 * Request logging + correlation id. Registered on the app instance in
 * app.ts. The x-request-id header is written onto the final response after
 * the chain completes (handlers return their own Response objects, so
 * setting it before `next()` would be lost).
 */
import { randomBytes } from "node:crypto";
import type { Context, Next } from "hono";
import type { AppEnv } from "./inertia-middleware";
import { safeUrl } from "./url";

export const requestLogger = async (c: Context<AppEnv>, next: Next) => {
	const requestId = randomBytes(6).toString("hex");
	const start = performance.now();
	const { pathname } = safeUrl(c.req.url);
	const method = c.req.method;
	c.set("requestId", requestId);

	const result = await next();

	const durationMs = (performance.now() - start).toFixed(1);
	c.res.headers.set("x-request-id", requestId);
	console.log(
		`[req:${requestId}] ${method} ${pathname} -> ${c.res.status} (${durationMs}ms)`,
	);
	return result;
};

export function logError(c: Context<AppEnv>, error: unknown): void {
	const { pathname } = safeUrl(c.req.url);
	const requestId = c.get("requestId") || "-";
	console.error(
		`[req:${requestId}] ${c.req.method} ${pathname} FAILED:`,
		error,
	);
}
