/**
 * gzip compression middleware — scoped to static assets and SSR HTML only.
 *
 * JSON/API responses are deliberately NOT compressed: they are small in this
 * app (< 1KB Inertia payloads), and transforming parsed-data responses is
 * where body-consumption/encoding bugs bite (see git history — a consumed
 * body on the early-return path broke every Inertia XHR navigation). The
 * bytes that benefit are the asset bundles and SSR HTML.
 *
 * Hono's built-in `compress()` relies on the Web `CompressionStream` API,
 * which is not reliably available in every Bun 1.3.14 context (verified
 * missing in one process environment, present in others) — so this uses
 * `node:zlib` instead, which every Bun ships.
 *
 * Skips HEAD, bodiless/204/206/304, already-encoded responses, and bodies
 * below the threshold; sets Vary: Accept-Encoding.
 */
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import type { Context, Next } from "hono";
import type { AppEnv } from "./inertia-middleware";

const gzipAsync = promisify(gzip);

const THRESHOLD_BYTES = 1024;
const IS_HTML = /^text\/html/;

/** True when the client's Accept-Encoding includes gzip (or *). */
function acceptsGzip(header: string | undefined): boolean {
	const tokens = (header ?? "")
		.toLowerCase()
		.split(",")
		.map((t) => t.trim());
	const gzip = tokens.find((t) => t.startsWith("gzip"));
	if (gzip) return !gzip.includes("q=0");
	return tokens.some((t) => t === "*" || t.startsWith("*;"));
}

export const compress = () => async (c: Context<AppEnv>, next: Next) => {
	await next();
	const res = c.res;
	if (res.body === null) return;
	if (res.status === 204 || res.status === 206 || res.status === 304) return;
	if (res.headers.has("content-encoding")) return;
	if (c.req.method === "HEAD") return;
	const type = res.headers.get("content-type") ?? "";
	// Only /assets/* (js/css/map bundles) and SSR HTML are compressed —
	// API/JSON responses pass through untouched.
	if (!c.req.path.startsWith("/assets/") && !IS_HTML.test(type)) return;
	// Uploaded bytes have attacker-declared content-types; never transform.
	if (c.req.path.startsWith("/uploads/")) return;
	if (!acceptsGzip(c.req.header("accept-encoding"))) return;

	const buf = Buffer.from(await res.arrayBuffer());
	// Reading the body CONSUMES it — every path below must rebuild the
	// response from `buf`, or the client gets a 200 with an empty body
	// (this broke Inertia XHR navigation: JSON payloads are < 1KB, so
	// the early returns left a consumed body in place).
	if (buf.byteLength < THRESHOLD_BYTES) {
		c.res = new Response(new Uint8Array(buf), res);
		return;
	}
	const compressed = await gzipAsync(buf);
	if (compressed.byteLength >= buf.byteLength) {
		// not worth it
		c.res = new Response(new Uint8Array(buf), res);
		return;
	}

	const vary = res.headers.get("vary");
	if (vary && !/\baccept-encoding\b/i.test(vary)) {
		res.headers.set("vary", `${vary}, Accept-Encoding`);
	} else if (!vary) {
		res.headers.set("vary", "Accept-Encoding");
	}
	res.headers.set("content-encoding", "gzip");
	res.headers.delete("content-length");
	c.res = new Response(new Uint8Array(compressed), res);
};
