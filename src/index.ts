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

const server = Bun.serve({
	port,
	fetch: createApp(assets).fetch,
});
console.log(`Hono Inertia boilerplate → http://localhost:${port}`);

function shutdown(signal: string): void {
	console.log(`\n${signal} received — shutting down`);
	server.stop(true); // graceful: wait for in-flight requests
	db.close();
	process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
