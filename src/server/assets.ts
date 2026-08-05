/**
 * Client asset pipeline:
 *  1. Tailwind v4 CLI compiles src/client/tailwind.css → src/client/.tailwind.css
 *  2. Bun.build bundles the Svelte client (app.ts) with the Svelte plugin
 *  3. Bun.build bundles the SSR entry (ssr.ts) with generate: 'server' → dist/ssr.js
 *  4. dist/assets/* (content-hashed) + dist/manifest.json
 * The asset version doubles as the Inertia version for cache busting.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import type { InertiaAssets } from "./inertia";
import { sveltePlugin } from "./svelte-plugin";

const DIST_DIR = "dist";
const ASSETS_DIR = `${DIST_DIR}/assets`;
const MANIFEST_PATH = `${DIST_DIR}/manifest.json`;
const TAILWIND_INPUT = "src/client/tailwind.css";
const TAILWIND_OUTPUT = "src/client/.tailwind.css";

async function compileTailwind(): Promise<void> {
	await Bun.$`bunx @tailwindcss/cli -i ${TAILWIND_INPUT} -o ${TAILWIND_OUTPUT} --minify`.quiet();
}

export async function buildClientAssets(): Promise<void> {
	// 1. Compile Tailwind v4 → static CSS (no PostCSS needed).
	await compileTailwind();

	// 2. Client bundle: Svelte compiled for browser.
	const result = await Bun.build({
		entrypoints: ["src/client/app.ts"],
		outdir: ASSETS_DIR,
		target: "browser",
		minify: true,
		sourcemap: "external",
		splitting: false,
		naming: "[name]-[hash].[ext]",
		plugins: [sveltePlugin("client")],
		conditions: ["svelte"],
		define: { "process.env.NODE_ENV": '"production"' },
	});
	if (!result.success) {
		console.error(result.logs.map(String).join("\n"));
		throw new Error("Client asset build failed");
	}

	const js = result.outputs.find(
		(o) => o.kind === "entry-point" && o.path.endsWith(".js"),
	);
	if (!js) throw new Error("No JS entrypoint produced by Bun.build");
	const css = result.outputs.find((o) => o.path.endsWith(".css"));

	// 3. SSR bundle: Svelte compiled for server-side rendering. Loaded lazily
	// by src/server/inertia.ts (dist/ssr.js must not be statically imported —
	// it doesn't exist on a fresh clone until this build runs).
	await Bun.build({
		entrypoints: ["src/client/ssr.ts"],
		plugins: [sveltePlugin("server")],
		target: "bun",
		outdir: DIST_DIR,
		naming: "ssr.js",
		conditions: ["svelte"],
		splitting: false,
		sourcemap: "external",
	});

	// 4. Manifest with content-hashed asset version.
	const digest = createHash("sha256");
	for (const file of [js, css].filter((f): f is typeof js => Boolean(f))) {
		digest.update(readFileSync(file.path));
	}

	const assets: InertiaAssets = {
		version: digest.digest("hex").slice(0, 16),
		js: basename(js.path),
		css: css ? basename(css.path) : "",
	};
	mkdirSync(DIST_DIR, { recursive: true });
	writeFileSync(MANIFEST_PATH, JSON.stringify(assets, null, 2));
	console.log(`Built client assets → dist/ (version ${assets.version})`);
}

export const manifestExists = (): boolean => existsSync(MANIFEST_PATH)

export function loadManifest(): InertiaAssets {
	const raw = readFileSync(MANIFEST_PATH, "utf8");
	try {
		return JSON.parse(raw) as InertiaAssets;
	} catch (e) {
		throw new Error(`Corrupt manifest at ${MANIFEST_PATH}: ${String(e)}`);
	}
}

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

/** Serves /assets/* from dist/assets with long-lived caching (hashed names). */
export async function serveAsset(relPath: string | undefined): Promise<Response> {
  if (!relPath || relPath.includes('..')) return new Response('Not found', { status: 404 })
  const file = Bun.file(`${ASSETS_DIR}/${relPath}`)
  if (!(await file.exists())) return new Response('Not found', { status: 404 })
  const ext = relPath.slice(relPath.lastIndexOf('.'))
  return new Response(file, {
    headers: {
      'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
