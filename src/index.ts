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

const isProd = process.env.NODE_ENV === "production";
if (!isProd || !manifestExists()) {
	await buildClientAssets();
}

const assets = loadManifest();
const port = config.port;

// Dev-only: watch src/client/** for Svelte edits and rebuild assets live.
// `bun --watch` only sees src/index.ts's import graph, which excludes the
// Svelte client (Bun.build entrypoints, not imports), so without this a
// .svelte change never rebuilds. Dynamic-imported so prod never loads it.
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
