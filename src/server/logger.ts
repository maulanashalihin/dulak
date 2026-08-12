/**
 * Structured request logging (JSON lines) + correlation id.
 *
 * Each log line is a JSON object written to stdout — parseable by Loki,
 * ELK, Datadog, or any log aggregator without regex. Lines are batched:
 * the per-request cost is one string push into an in-memory buffer (no
 * syscall on the hot path). A timer flushes every FLUSH_INTERVAL_MS, and
 * the 'exit' handler drains synchronously so shutdown never loses lines.
 * Errors are written immediately to stderr — never batched.
 *
 * /health, /metrics, and /assets/* still get the x-request-id header but
 * produce no log line (infrastructure noise, not user traffic).
 */
import { randomBytes } from "node:crypto";
import { writeSync } from "node:fs";
import type { Context, Next } from "hono";
import type { AppEnv } from "./inertia-middleware";
import { safeUrl } from "./url";

const FLUSH_INTERVAL_MS = 50;
const SILENT_PATHS = [/^\/health$/, /^\/metrics$/, /^\/assets\//];

let buffer: string[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

function flush(): void {
	if (buffer.length === 0) return;
	const lines = `${buffer.join("\n")}\n`;
	buffer = [];
	writeSync(1, lines); // fd 1 = stdout (12-factor: logs go to stdout)
}

function schedule(): void {
	if (timer) return;
	timer = setInterval(flush, FLUSH_INTERVAL_MS);
	timer.unref?.(); // must not keep the process alive
}

process.on("exit", () => {
	if (buffer.length > 0) {
		// Synchronous drain on shutdown (the interval may be unref'd).
		writeSync(1, `${buffer.join("\n")}\n`);
		buffer = [];
	}
});

export const requestLogger = async (c: Context<AppEnv>, next: Next) => {
	const requestId = randomBytes(6).toString("hex");
	const start = performance.now();
	const { pathname } = safeUrl(c.req.url);
	const method = c.req.method;
	c.set("requestId", requestId);

	const result = await next();

	const durationMs = Number((performance.now() - start).toFixed(1));
	c.res.headers.set("x-request-id", requestId);
	if (!SILENT_PATHS.some((re) => re.test(pathname))) {
		buffer.push(
			JSON.stringify({
				ts: new Date().toISOString(),
				level: c.res.status >= 500 ? "error" : c.res.status >= 400 ? "warn" : "info",
				requestId,
				method,
				path: pathname,
				status: c.res.status,
				durationMs,
			}),
		);
		schedule();
	}
	return result;
};

export function logError(c: Context<AppEnv>, error: unknown): void {
	const { pathname } = safeUrl(c.req.url);
	const requestId = c.get("requestId") || "-";
	const line = JSON.stringify({
		ts: new Date().toISOString(),
		level: "error",
		requestId,
		method: c.req.method,
		path: pathname,
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
	});
	writeSync(2, `${line}\n`); // fd 2 = stderr — immediate, never batched
}
