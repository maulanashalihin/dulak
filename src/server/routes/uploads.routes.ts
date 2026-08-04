/**
 * Upload routes at /uploads — tus protocol endpoints with inline handlers.
 * Implements the `X-HTTP-Method-Override` hook (spec-required) so clients in
 * environments that lack PATCH/DELETE can still drive the protocol.
 *
 * Auth is enforced inside the handlers (session cookie). The CSRF Origin
 * check in security.ts applies to same-origin Inertia clients (which pass
 * naturally); cross-origin tus clients would need a separate token scheme
 * (out of scope for the MVP).
 */
import { Elysia } from "elysia";
import { resolveUser } from "../auth";
import { config } from "../config";
import {
	H,
	OFFSET_CONTENT_TYPE,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_VERSIONS,
	TUS_VERSION,
	checkVersion,
	generateUploadId,
	parseMetadata,
	verifyChecksum,
} from "../tus-protocol";
import {
	advanceOffset,
	deleteUpload,
	findUpload,
	insertUpload,
	listExpired,
} from "../db";
import { appendBytes, fileSize, removeFile, uploadPath } from "../tus-storage";

const UPLOAD_PREFIX = "/uploads/";

/** Resolve the session cookie from a Request and return the user id (or null). */
function userIdFromRequest(req: Request): number | null {
	const raw = req.headers.get("cookie") ?? "";
	const match = raw.match(/(?:^|;\s*)session=([^;]+)/);
	if (!match) return null;
	const row = resolveUser(match[1]);
	return row ? row.id : null;
}

/** Build a JSON error response with tus headers. */
function errorResponse(
	status: number,
	message: string,
	extra: Record<string, string> = {},
): Response {
	const headers: Record<string, string> = {
		[H.tusResumable]: TUS_VERSION,
		"content-type": "application/json",
		"cache-control": "no-store",
		...extra,
	};
	return new Response(JSON.stringify({ error: message }), { status, headers });
}

/** Common tus headers for success responses. */
function okResponse(
	status: number,
	body: BodyInit | null,
	extra: Record<string, string | number>,
): Response {
	const headers: Record<string, string> = {
		[H.tusResumable]: TUS_VERSION,
		"cache-control": "no-store",
	};
	for (const [k, v] of Object.entries(extra)) headers[k] = String(v);
	return new Response(body, { status, headers });
}

/** Compute the Expires header (RFC 7231 date) from a TTL in seconds. */
function expiresHeaderFromNow(ttlSeconds: number): string | null {
	if (ttlSeconds <= 0) return null;
	const d = new Date(Date.now() + ttlSeconds * 1000);
	return d.toUTCString();
}

// ---------------------------------------------------------------------------
// OPTIONS — server capability advertisement (no auth, no Tus-Resumable).
// ---------------------------------------------------------------------------

export function handleOptions(): Response {
	const headers: Record<string, string> = {
		[H.tusResumable]: TUS_VERSION,
		[H.tusVersion]: SUPPORTED_VERSIONS.join(","),
		[H.tusExtension]: SUPPORTED_EXTENSIONS.join(","),
		"cache-control": "no-store",
	};
	if (config.upload.maxSize > 0)
		headers[H.tusMaxSize] = String(config.upload.maxSize);
	return new Response(null, { status: 204, headers });
}

// ---------------------------------------------------------------------------
// POST — Creation (+ Creation-With-Upload if a body is present).
// ---------------------------------------------------------------------------

export async function handlePost(
	req: Request,
	body: ArrayBuffer | undefined,
): Promise<Response> {
	const versionErr = checkVersion(req.headers);
	if (versionErr)
		return errorResponse(412, versionErr, {
			[H.tusVersion]: SUPPORTED_VERSIONS.join(","),
		});

	const userId = userIdFromRequest(req);
	if (!userId) return errorResponse(401, "Authentication required");

	const lengthHeader = req.headers.get(H.uploadLength.toLowerCase());
	if (!lengthHeader)
		return errorResponse(400, `Missing ${H.uploadLength} header`);
	const uploadLength = Number(lengthHeader);
	if (!Number.isFinite(uploadLength) || uploadLength < 0) {
		return errorResponse(400, `Invalid ${H.uploadLength}`);
	}
	if (config.upload.maxSize > 0 && uploadLength > config.upload.maxSize) {
		return errorResponse(413, "Upload exceeds maximum size");
	}

	const id = generateUploadId();
	const metadata = parseMetadata(
		req.headers.get(H.uploadMetadata.toLowerCase()),
	);
	const expiresAt = expiresHeaderFromNow(config.upload.expirationSeconds);
	const isoExpires = expiresAt ? new Date(expiresAt).toISOString() : null;

	insertUpload.run(
		id,
		uploadLength,
		JSON.stringify(metadata),
		userId,
		uploadPath(id),
		isoExpires,
	);

	// Creation-With-Upload: if the POST carries a body, append it immediately.
	let initialOffset = 0;
	if (body && body.byteLength > 0) {
		const buf = new Uint8Array(body);
		if (buf.byteLength > uploadLength) {
			removeFile(id);
			deleteUpload.run(id);
			return errorResponse(413, "Initial chunk exceeds declared upload length");
		}
		const checksumHeader = req.headers.get(H.uploadChecksum.toLowerCase());
		if (checksumHeader && !(await verifyChecksum(checksumHeader, buf))) {
			removeFile(id);
			deleteUpload.run(id);
			return errorResponse(460, "Checksum mismatch");
		}
		await appendBytes(id, buf);
		initialOffset = buf.byteLength;
		const res = advanceOffset.get(buf.byteLength, id, 0);
		if (!res || res.n !== 1) {
			// Race: shouldn't happen on a fresh row, but stay safe.
			removeFile(id);
			deleteUpload.run(id);
			return errorResponse(409, "Offset conflict on initial append");
		}
	}

	const extra: Record<string, string | number> = {
		[H.location]: `${UPLOAD_PREFIX}${id}`,
		[H.uploadOffset]: initialOffset,
	};
	if (expiresAt) extra[H.uploadExpires] = expiresAt;
	return okResponse(201, null, extra);
}

// ---------------------------------------------------------------------------
// HEAD — return current offset (and length if known).
// ---------------------------------------------------------------------------

export function handleHead(req: Request, id: string): Response {
	const versionErr = checkVersion(req.headers);
	if (versionErr)
		return errorResponse(412, versionErr, {
			[H.tusVersion]: SUPPORTED_VERSIONS.join(","),
		});

	const row = findUpload.get(id);
	if (!row || row.userId !== userIdFromRequest(req)) {
		return errorResponse(404, "Upload not found");
	}
	// Reconcile offset with the actual file size (defence in depth).
	const actual = fileSize(id);
	const offset = Math.max(row.offset, actual);
	return okResponse(200, null, {
		[H.uploadOffset]: offset,
		[H.uploadLength]: row.uploadLength,
	});
}

// ---------------------------------------------------------------------------
// PATCH — append bytes at the current offset.
// ---------------------------------------------------------------------------

export async function handlePatch(
	req: Request,
	id: string,
	body: ArrayBuffer | undefined,
): Promise<Response> {
	const versionErr = checkVersion(req.headers);
	if (versionErr)
		return errorResponse(412, versionErr, {
			[H.tusVersion]: SUPPORTED_VERSIONS.join(","),
		});

	const row = findUpload.get(id);
	if (!row || row.userId !== userIdFromRequest(req)) {
		return errorResponse(404, "Upload not found");
	}

	const contentType = req.headers.get("content-type") ?? "";
	if (contentType !== OFFSET_CONTENT_TYPE) {
		return errorResponse(415, `Content-Type must be ${OFFSET_CONTENT_TYPE}`);
	}

	const offsetHeader = req.headers.get(H.uploadOffset.toLowerCase());
	if (offsetHeader === null)
		return errorResponse(400, `Missing ${H.uploadOffset}`);
	const clientOffset = Number(offsetHeader);
	if (!Number.isFinite(clientOffset) || clientOffset < 0) {
		return errorResponse(400, `Invalid ${H.uploadOffset}`);
	}
	if (clientOffset !== row.offset) {
		return errorResponse(409, "Upload-Offset does not match current offset");
	}

	const buf = body ? new Uint8Array(body) : new Uint8Array(0);
	if (buf.byteLength === 0) {
		return okResponse(204, null, { [H.uploadOffset]: row.offset });
	}
	if (row.offset + buf.byteLength > row.uploadLength) {
		return errorResponse(413, "Chunk exceeds declared upload length");
	}

	const checksumHeader = req.headers.get(H.uploadChecksum.toLowerCase());
	if (checksumHeader && !(await verifyChecksum(checksumHeader, buf))) {
		return errorResponse(460, "Checksum mismatch");
	}

	await appendBytes(id, buf);
	const res = advanceOffset.get(buf.byteLength, id, row.offset);
	if (!res || res.n !== 1) {
		// Concurrent PATCH raced us — tell the client to re-sync via HEAD.
		return errorResponse(409, "Offset conflict (concurrent write)");
	}

	return okResponse(204, null, {
		[H.uploadOffset]: row.offset + buf.byteLength,
	});
}

// ---------------------------------------------------------------------------
// DELETE — Termination extension.
// ---------------------------------------------------------------------------

export function handleDelete(req: Request, id: string): Response {
	const versionErr = checkVersion(req.headers);
	if (versionErr)
		return errorResponse(412, versionErr, {
			[H.tusVersion]: SUPPORTED_VERSIONS.join(","),
		});

	const row = findUpload.get(id);
	if (!row || row.userId !== userIdFromRequest(req)) {
		return errorResponse(404, "Upload not found");
	}
	removeFile(id);
	deleteUpload.run(id);
	return okResponse(204, null, {});
}

// ---------------------------------------------------------------------------
// Background sweep for the Expiration extension.
// ---------------------------------------------------------------------------

export function sweepExpired(): void {
	if (config.upload.expirationSeconds <= 0) return;
	const now = new Date().toISOString();
	const expired = listExpired.all(now);
	for (const row of expired) {
		removeFile(row.id);
		deleteUpload.run(row.id);
	}
}

/** Apply X-HTTP-Method-Override by re-dispatching to the right handler. */
async function dispatch(
	req: Request,
	id: string | null,
	body: ArrayBuffer | undefined,
): Promise<Response> {
	const override = req.headers.get(H.xHttpMethodOverride.toLowerCase());
	const method = (override ?? req.method).toUpperCase();
	if (method === "OPTIONS") return handleOptions();
	if (method === "POST" && !id) return handlePost(req, body);
	if (method === "HEAD" && id) return handleHead(req, id);
	if (method === "PATCH" && id) return handlePatch(req, id, body);
	if (method === "DELETE" && id) return handleDelete(req, id);
	return new Response(JSON.stringify({ error: "Method not allowed" }), {
		status: 405,
		headers: { "content-type": "application/json" },
	});
}

export const uploadsRoutes = () =>
	new Elysia({ name: "uploads-routes", prefix: "/uploads" })
		// OPTIONS /uploads — server capabilities (no auth, no Tus-Resumable).
		.options("/", () => handleOptions())
		.options("/*", () => handleOptions())
		// POST /uploads — create a new upload resource (Creation extension).
		.post("/", ({ request, body }) =>
			dispatch(request, null, body as ArrayBuffer),
		)
		// POST /uploads/:id — supports X-HTTP-Method-Override: PATCH/DELETE.
		.post("/*", ({ request, params, body }) =>
			dispatch(request, (params["*"] as string) ?? null, body as ArrayBuffer),
		)
		// /uploads/:id — HEAD / PATCH / DELETE
		.head("/*", ({ request, params }) =>
			dispatch(request, (params["*"] as string) ?? null, undefined),
		)
		.patch("/*", ({ request, params, body }) =>
			dispatch(request, (params["*"] as string) ?? null, body as ArrayBuffer),
		)
		.delete("/*", ({ request, params }) =>
			dispatch(request, (params["*"] as string) ?? null, undefined),
		);
