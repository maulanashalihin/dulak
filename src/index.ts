/**
 * Entry point. Builds client assets on first run / in dev, then serves.
 *   bun run dev    → watch mode, rebuilds assets on restart
 *   bun run build  → prebuild assets for production
 *   bun run start  → serve prebuilt assets (NODE_ENV=production)
 *
 * Bun.serve hands the Bun Server to `fetch` as its 2nd argument, which Hono
 * stores as `c.env` — the rate limiter reads the peer IP from it.
 */
import {
	buildClientAssets,
	loadManifest,
	manifestExists,
} from "./server/assets";
import { createApp } from "./server/app";
import { config } from "./server/config";
import { db } from "./server/db";
import net from "node:net";

const isProd = process.env.NODE_ENV === "production";
if (!isProd || !manifestExists()) {
	await buildClientAssets();
}

const assets = loadManifest();

/**
 * Dev-only: find the first free port starting from `start`, probing up to
 * `max` increments. In production the configured port is used as-is — a busy
 * port fails loudly instead of silently shifting (which would break reverse
 * proxies, health checks, and OAuth redirect URIs that point at a fixed port).
 */
async function findAvailablePort(start: number, max = 100): Promise<number> {
	const { promise, resolve, reject } =
		Promise.withResolvers<number>();
	let port = start;
	const probe = () => {
		const tester = net.createServer();
		tester.once("error", (err: NodeJS.ErrnoException) => {
			if (err.code !== "EADDRINUSE") return reject(err);
			if (++port > start + max)
				return reject(
					new Error(`No available port in ${start}–${start + max}`),
				);
			probe();
		});
		tester.once("listening", () => tester.close(() => resolve(port)));
		tester.listen(port);
	};
	probe();
	return promise;
}

let port = config.port;
if (!isProd) {
	port = await findAvailablePort(config.port);
	if (port !== config.port) {
		console.log(
			`Port ${config.port} in use — switching to ${port} (set PORT to skip)`,
		);
		config.port = port;
		// Only derive appUrl from the actual port when the user did not set
		// APP_URL explicitly — an explicit APP_URL wins (OAuth redirect URIs
		// must match Google Console regardless of the dev port).
		if (!process.env.APP_URL) config.appUrl = `http://localhost:${port}`;
	}
}

// Dev-only: watch src/client/** for component edits and rebuild assets live.
// `bun --watch` only sees src/index.ts's import graph, which excludes the
// framework client (Bun.build entrypoints, not imports — except React,
// where ssr.tsx is statically imported), so without this a .svelte/.vue
// change never rebuilds. Dynamic-imported so prod never loads it.
if (!isProd) {
	const { startClientWatcher } = await import("./server/client-watcher");
	startClientWatcher(assets);
}

const server = Bun.serve({
	port,
	fetch: createApp(assets).fetch,
});
console.log(`Dulak boilerplate → http://localhost:${port}`);

function shutdown(signal: string): void {
	console.log(`\n${signal} received — shutting down`);
	server.stop(true); // graceful: wait for in-flight requests
	db.close();
	process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// Fail loudly on stray async errors instead of swallowing them; the
// supervisor (Docker restart policy) brings the process back up.
process.on("unhandledRejection", (reason) => {
	console.error("Unhandled promise rejection:", reason);
	process.exit(1);
});
