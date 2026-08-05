/**
 * tus protocol constants & helpers (https://tus.io/protocols/resumable-upload).
 *
 * The server implements the core protocol plus the `creation`,
 * `creation-with-upload`, `termination`, `expiration` and `checksum`
 * extensions. All headers are case-insensitive per RFC 9110 but we use the
 * canonical casing emitted by tus clients.
 */
import { createHash } from "node:crypto";

export const TUS_VERSION = "1.0.0";
export const SUPPORTED_VERSIONS = [TUS_VERSION];
export const SUPPORTED_EXTENSIONS = [
	"creation",
	"creation-with-upload",
	"termination",
	"expiration",
	"checksum",
];

/** Content-Type that PATCH requests must use (per spec). */
export const OFFSET_CONTENT_TYPE = "application/offset+octet-stream";

/** Headers used across requests/responses. */
export const H = {
	tusResumable: "Tus-Resumable",
	tusVersion: "Tus-Version",
	tusExtension: "Tus-Extension",
	tusMaxSize: "Tus-Max-Size",
	uploadOffset: "Upload-Offset",
	uploadLength: "Upload-Length",
	uploadMetadata: "Upload-Metadata",
	uploadExpires: "Upload-Expires",
	uploadChecksum: "Upload-Checksum",
	location: "Location",
	xHttpMethodOverride: "X-HTTP-Method-Override",
	cacheControl: "Cache-Control",
} as const;

/** Set the canonical tus response headers on a Headers object. */
export function applyTusHeaders(
	headers: Record<string, string | number>,
	extra: Record<string, string | number> = {},
): void {
	headers[H.tusResumable] = TUS_VERSION;
	for (const [k, v] of Object.entries(extra)) headers[k] = v;
}

/** Verify the `Tus-Resumable` request header; returns an error string if invalid. */
export function checkVersion(reqHeaders: Headers): string | null {
	const v = reqHeaders.get(H.tusResumable.toLowerCase());
	if (!v) return `Missing ${H.tusResumable} header`;
	if (!SUPPORTED_VERSIONS.includes(v)) return `Unsupported tus version: ${v}`;
	return null;
}

/** Parse `Upload-Metadata` (comma-separated key base64value pairs). */
export function parseMetadata(raw: string | null): Record<string, string> {
	if (!raw) return {};
	const out: Record<string, string> = {};
	for (const pair of raw.split(",")) {
		const trimmed = pair.trim();
		if (!trimmed) continue;
		const space = trimmed.indexOf(" ");
		if (space === -1) {
			out[trimmed] = "";
		} else {
			const key = trimmed.slice(0, space);
			const b64 = trimmed.slice(space + 1);
			try {
				out[key] = Buffer.from(b64, "base64").toString("utf8");
			} catch {
				out[key] = b64;
			}
		}
	}
	return out;
}

/** Generate a URL-safe random upload id (22 chars base64url, ~128 bits). */
export function generateUploadId(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Buffer.from(bytes).toString("base64url");
}

/** Verify an `Upload-Checksum` header against a chunk buffer.
 *  Format: `algorithm base64checksum` (e.g. `sha1 base64...`). */
export async function verifyChecksum(
	header: string | null,
	data: Uint8Array,
): Promise<boolean> {
	if (!header) return true;
	const space = header.indexOf(" ");
	if (space === -1) return false;
	const algo = header.slice(0, space).toLowerCase();
	const expectedB64 = header.slice(space + 1).trim();
	// Map tus algorithm names to SubtleCrypto names.
	const subtleAlgo: Record<string, string> = {
		sha1: "SHA-1",
		sha256: "SHA-256",
		sha384: "SHA-384",
		sha512: "SHA-512",
		md5: "MD5",
	};
	const name = subtleAlgo[algo];
	if (!name) return false;
	// MD5 is not supported by SubtleCrypto; fall back to node:crypto.
	if (algo === "md5") {
		const digest = createHash("md5").update(data).digest("base64");
		return digest === expectedB64;
	}
	const digest = new Uint8Array(
		await crypto.subtle.digest(name, data.buffer as ArrayBuffer),
	);
	const actualB64 = Buffer.from(digest).toString("base64");
	return actualB64 === expectedB64;
}
