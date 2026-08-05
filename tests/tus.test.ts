/**
 * tus protocol E2E tests: boots the full app against an in-memory SQLite DB
 * and a temp upload directory, then drives the protocol via app.handle().
 * Covers: OPTIONS, Creation (POST), HEAD, PATCH (resume), Termination,
 * Creation-With-Upload, checksum, and auth/ownership enforcement.
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

let app: Awaited<ReturnType<typeof import("../src/server/app")["createApp"]>>;
let uploadDir: string;

beforeAll(async () => {
	// Must be set before any app module is imported (config/db read env at import).
	uploadDir = mkdtempSync(join(tmpdir(), "tus-test-"));
	process.env.DATABASE_PATH = ":memory:";
	process.env.UPLOAD_DIR = uploadDir;
	process.env.NODE_ENV = "test";
	process.env.RATE_LIMIT_AUTH_MAX = "1000";
	process.env.TUS_MAX_SIZE = "0"; // unlimited
	process.env.GOOGLE_CLIENT_ID = "test-client-id";
	process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
	const { createApp } = await import("../src/server/app");
	app = createApp({ version: "test-version", js: "app.js", css: "app.css" });
});

afterAll(async () => {
	const { db } = await import("../src/server/db");
	db.close();
	try {
		rmSync(uploadDir, { recursive: true, force: true });
	} catch {
		/* ignore */
	}
});

const TUS = { "Tus-Resumable": "1.0.0" };
const BASE = "http://localhost:3000";

async function tus(
	path: string,
	options: {
		method?: string;
		headers?: Record<string, string>;
		body?: BodyInit;
		cookie?: string;
	} = {},
): Promise<Response> {
	const headers = new Headers({ ...TUS, ...(options.headers ?? {}) });
	if (options.cookie) headers.set("cookie", options.cookie);
	return app.request(`${BASE}${path}`, {
		method: options.method ?? "GET",
		headers,
		body: options.body,
	});
}

/** Collect every Set-Cookie header (Bun/undici exposes getSetCookie). */
function allSetCookies(res: Response): string[] {
	const headers = res.headers as Headers & { getSetCookie?: () => string[] };
	return typeof headers.getSetCookie === "function"
		? headers.getSetCookie()
		: [res.headers.get("set-cookie") ?? ""].filter(Boolean);
}

function sessionCookie(res: Response): string {
	const cookie = allSetCookies(res).find((c) => c.startsWith("session="));
	return cookie ? cookie.split(";")[0]! : "";
}

async function registerUser(
	email: string,
	password = "password123",
): Promise<string> {
	const res = await tus("/register", {
		method: "POST",
		headers: { "x-inertia": "true", "content-type": "application/json" },
		body: JSON.stringify({ name: "Test User", email, password }),
	});
	expect(res.status).toBe(303);
	const cookie = sessionCookie(res);
	expect(cookie).not.toBe("");
	return cookie;
}

describe("tus OPTIONS", () => {
	it("advertises version and extensions without auth", async () => {
		const res = await tus("/uploads", { method: "OPTIONS" });
		expect(res.status).toBe(204);
		expect(res.headers.get("Tus-Resumable")).toBe("1.0.0");
		expect(res.headers.get("Tus-Version")).toBe("1.0.0");
		const exts = (res.headers.get("Tus-Extension") ?? "").split(",");
		expect(exts).toContain("creation");
		expect(exts).toContain("termination");
		expect(exts).toContain("checksum");
	});
});

describe("tus core flow", () => {
	let cookie: string;
	let uploadId: string;
	const totalSize = 100;

	beforeAll(async () => {
		cookie = await registerUser("tus-core@example.com");
	});

	it("rejects POST without auth", async () => {
		const res = await tus("/uploads", {
			method: "POST",
			headers: { "Upload-Length": String(totalSize) },
		});
		expect(res.status).toBe(401);
	});

	it("rejects POST without Upload-Length", async () => {
		const res = await tus("/uploads", { method: "POST", cookie });
		expect(res.status).toBe(400);
	});

	it("rejects POST with wrong Tus-Resumable version", async () => {
		const res = await tus("/uploads", {
			method: "POST",
			headers: { "Tus-Resumable": "0.2.2", "Upload-Length": "10" },
			cookie,
		});
		expect(res.status).toBe(412);
		expect(res.headers.get("Tus-Version")).toBe("1.0.0");
	});

	it("creates an upload (POST) and returns Location + offset 0", async () => {
		const res = await tus("/uploads", {
			method: "POST",
			headers: {
				"Upload-Length": String(totalSize),
				"Upload-Metadata": `filename ${Buffer.from("hello.txt").toString("base64")}`,
			},
			cookie,
		});
		expect(res.status).toBe(201);
		const location = res.headers.get("Location") ?? "";
		expect(location.startsWith("/uploads/")).toBe(true);
		expect(res.headers.get("Upload-Offset")).toBe("0");
		uploadId = location.replace("/uploads/", "");
	});

	it("HEAD reports offset 0 and full length", async () => {
		const res = await tus(`/uploads/${uploadId}`, { method: "HEAD", cookie });
		expect(res.status).toBe(200);
		expect(res.headers.get("Upload-Offset")).toBe("0");
		expect(res.headers.get("Upload-Length")).toBe(String(totalSize));
		expect(res.headers.get("Cache-Control")).toBe("no-store");
	});

	it("PATCH appends bytes and advances offset", async () => {
		const chunk = new Uint8Array(70);
		for (let i = 0; i < chunk.length; i++) chunk[i] = i;
		const res = await tus(`/uploads/${uploadId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: chunk,
			cookie,
		});
		expect(res.status).toBe(204);
		expect(res.headers.get("Upload-Offset")).toBe("70");
	});

	it("HEAD reports offset 70 after partial upload", async () => {
		const res = await tus(`/uploads/${uploadId}`, { method: "HEAD", cookie });
		expect(res.headers.get("Upload-Offset")).toBe("70");
	});

	it("rejects PATCH with wrong Content-Type", async () => {
		const res = await tus(`/uploads/${uploadId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/octet-stream",
				"Upload-Offset": "70",
			},
			body: new Uint8Array(10),
			cookie,
		});
		expect(res.status).toBe(415);
	});

	it("rejects PATCH with stale Upload-Offset (409)", async () => {
		const res = await tus(`/uploads/${uploadId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: new Uint8Array(10),
			cookie,
		});
		expect(res.status).toBe(409);
	});

	it("resumes the upload from offset 70 and completes it", async () => {
		const chunk = new Uint8Array(30);
		for (let i = 0; i < chunk.length; i++) chunk[i] = 70 + i;
		const res = await tus(`/uploads/${uploadId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "70",
			},
			body: chunk,
			cookie,
		});
		expect(res.status).toBe(204);
		expect(res.headers.get("Upload-Offset")).toBe("100");
	});

	it("stored file matches the uploaded bytes", async () => {
		const expected = new Uint8Array(100);
		for (let i = 0; i < 100; i++) expected[i] = i;
		const buf = readFileSync(join(uploadDir, uploadId));
		expect(new Uint8Array(buf)).toEqual(expected);
	});

	it("HEAD on completed upload reports full offset", async () => {
		const res = await tus(`/uploads/${uploadId}`, { method: "HEAD", cookie });
		expect(res.headers.get("Upload-Offset")).toBe("100");
	});

	it("rejects PATCH that would exceed Upload-Length (413)", async () => {
		const res = await tus(`/uploads/${uploadId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "100",
			},
			body: new Uint8Array(1),
			cookie,
		});
		expect(res.status).toBe(413);
	});

	it("terminates the upload (DELETE)", async () => {
		const res = await tus(`/uploads/${uploadId}`, { method: "DELETE", cookie });
		expect(res.status).toBe(204);
		// File + row are gone.
		expect(existsSync(join(uploadDir, uploadId))).toBe(false);
		const head = await tus(`/uploads/${uploadId}`, { method: "HEAD", cookie });
		expect(head.status).toBe(404);
	});
});

describe("tus ownership", () => {
	let ownerCookie: string;
	let otherCookie: string;
	let uploadId: string;

	beforeAll(async () => {
		ownerCookie = await registerUser("tus-owner@example.com");
		otherCookie = await registerUser("tus-other@example.com");
		const res = await tus("/uploads", {
			method: "POST",
			headers: { "Upload-Length": "10" },
			cookie: ownerCookie,
		});
		uploadId = (res.headers.get("Location") ?? "").replace("/uploads/", "");
	});

	it("rejects HEAD from a different user (404)", async () => {
		const res = await tus(`/uploads/${uploadId}`, {
			method: "HEAD",
			cookie: otherCookie,
		});
		expect(res.status).toBe(404);
	});

	it("rejects PATCH from a different user (404)", async () => {
		const res = await tus(`/uploads/${uploadId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: new Uint8Array(1),
			cookie: otherCookie,
		});
		expect(res.status).toBe(404);
	});

	it("rejects DELETE from a different user (404)", async () => {
		const res = await tus(`/uploads/${uploadId}`, {
			method: "DELETE",
			cookie: otherCookie,
		});
		expect(res.status).toBe(404);
	});
});

describe("tus creation-with-upload", () => {
	let cookie: string;

	beforeAll(async () => {
		cookie = await registerUser("tus-cwu@example.com");
	});

	it("accepts body on POST and reports initial offset", async () => {
		const payload = new Uint8Array(25);
		for (let i = 0; i < 25; i++) payload[i] = i + 1;
		const res = await tus("/uploads", {
			method: "POST",
			headers: {
				"Upload-Length": "25",
				"Content-Type": "application/offset+octet-stream",
			},
			body: payload,
			cookie,
		});
		expect(res.status).toBe(201);
		expect(res.headers.get("Upload-Offset")).toBe("25");
		const id = (res.headers.get("Location") ?? "").replace("/uploads/", "");
		const head = await tus(`/uploads/${id}`, { method: "HEAD", cookie });
		expect(head.headers.get("Upload-Offset")).toBe("25");
	});

	it("rejects initial body exceeding Upload-Length (413)", async () => {
		const res = await tus("/uploads", {
			method: "POST",
			headers: {
				"Upload-Length": "5",
				"Content-Type": "application/offset+octet-stream",
			},
			body: new Uint8Array(10),
			cookie,
		});
		expect(res.status).toBe(413);
	});
});

describe("tus checksum", () => {
	let cookie: string;

	beforeAll(async () => {
		cookie = await registerUser("tus-checksum@example.com");
	});

	it("accepts a PATCH with a valid sha1 Upload-Checksum", async () => {
		const res = await tus("/uploads", {
			method: "POST",
			headers: { "Upload-Length": "5" },
			cookie,
		});
		const id = (res.headers.get("Location") ?? "").replace("/uploads/", "");
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const digest = createHash("sha1").update(data).digest("base64");
		const patch = await tus(`/uploads/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
				"Upload-Checksum": `sha1 ${digest}`,
			},
			body: data,
			cookie,
		});
		expect(patch.status).toBe(204);
		expect(patch.headers.get("Upload-Offset")).toBe("5");
	});

	it("rejects a PATCH with a bad sha1 Upload-Checksum (460)", async () => {
		const res = await tus("/uploads", {
			method: "POST",
			headers: { "Upload-Length": "5" },
			cookie,
		});
		const id = (res.headers.get("Location") ?? "").replace("/uploads/", "");
		const patch = await tus(`/uploads/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
				"Upload-Checksum": "sha1 aGVsbG8=",
			},
			body: new Uint8Array([1, 2, 3, 4, 5]),
			cookie,
		});
		expect(patch.status).toBe(460);
	});
});

describe("tus X-HTTP-Method-Override", () => {
	let cookie: string;

	beforeAll(async () => {
		cookie = await registerUser("tus-override@example.com");
	});

	it("treats a POST as PATCH when X-HTTP-Method-Override: PATCH is set", async () => {
		const create = await tus("/uploads", {
			method: "POST",
			headers: { "Upload-Length": "3" },
			cookie,
		});
		const id = (create.headers.get("Location") ?? "").replace("/uploads/", "");
		// Client can only POST — emulate via override.
		const res = await tus(`/uploads/${id}`, {
			method: "POST",
			headers: {
				"X-HTTP-Method-Override": "PATCH",
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: new Uint8Array([9, 9, 9]),
			cookie,
		});
		expect(res.status).toBe(204);
		expect(res.headers.get("Upload-Offset")).toBe("3");
	});
});

describe("tus 404 paths", () => {
	let cookie: string;

	beforeAll(async () => {
		cookie = await registerUser("tus-404@example.com");
	});

	it("HEAD on unknown id returns 404 without Upload-Offset", async () => {
		const res = await tus("/uploads/does-not-exist", {
			method: "HEAD",
			cookie,
		});
		expect(res.status).toBe(404);
		expect(res.headers.get("Upload-Offset")).toBe(null);
	});

	it("PATCH on unknown id returns 404", async () => {
		const res = await tus("/uploads/nope", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: new Uint8Array(1),
			cookie,
		});
		expect(res.status).toBe(404);
	});
});

describe("profile page & avatar upload", () => {
	let cookie: string;
	let otherCookie: string;
	const PNG = new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
	]);

	beforeAll(async () => {
		cookie = await registerUser("avatar-owner@example.com");
		otherCookie = await registerUser("avatar-other@example.com");
	});

	async function uploadImage(
		uploaderCookie: string,
		filetype: string,
	): Promise<string> {
		const create = await tus("/uploads", {
			method: "POST",
			headers: {
				"Upload-Length": String(PNG.byteLength),
				"Upload-Metadata": `filename ${Buffer.from("avatar.png").toString("base64")},filetype ${Buffer.from(filetype).toString("base64")}`,
			},
			cookie: uploaderCookie,
		});
		expect(create.status).toBe(201);
		const id = (create.headers.get("Location") ?? "").replace("/uploads/", "");
		const res = await tus(`/uploads/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: PNG,
			cookie: uploaderCookie,
		});
		expect(res.status).toBe(204);
		return id;
	}

	it("redirects guests away from /profile", async () => {
		const res = await tus("/profile");
		expect(res.status).toBe(302);
		expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/login");
	});

	it("renders the Profile page for authenticated users", async () => {
		const res = await tus("/profile", {
			headers: { "x-inertia": "true" },
			cookie,
		});
		expect(res.status).toBe(200);
		const data = (await res.json()) as { component: string };
		expect(data.component).toBe("Profile");
	});

	it("links a completed image upload as the avatar", async () => {
		const id = await uploadImage(cookie, "image/png");
		const res = await tus("/profile/avatar", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ uploadId: id }),
			cookie,
		});
		expect(res.status).toBe(204);

		// Shared props expose the new avatar to the client.
		const dash = await tus("/dashboard", {
			headers: { "x-inertia": "true" },
			cookie,
		});
		const page = (await dash.json()) as {
			props: { auth: { user: { avatarUrl: string | null } } };
		};
		expect(page.props.auth.user.avatarUrl).toBe(`/uploads/${id}`);

		// The stored bytes are served back with the declared content type.
		const file = await tus(`/uploads/${id}`, { method: "GET", cookie });
		expect(file.status).toBe(200);
		expect(file.headers.get("content-type")).toBe("image/png");
		expect(new Uint8Array(await file.arrayBuffer())).toEqual(PNG);
	});

	it("rejects non-image uploads as avatars", async () => {
		const id = await uploadImage(cookie, "text/plain");
		const res = await tus("/profile/avatar", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ uploadId: id }),
			cookie,
		});
		expect(res.status).toBe(422);
	});

	it("rejects SVG uploads as avatars (stored-XSS guard)", async () => {
		const id = await uploadImage(cookie, "image/svg+xml");
		const res = await tus("/profile/avatar", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ uploadId: id }),
			cookie,
		});
		expect(res.status).toBe(422);
	});

	it("serves upload bytes with script-src 'none' (no script execution)", async () => {
		const create = await tus("/uploads", {
			method: "POST",
			headers: {
				"Upload-Length": "4",
				"Upload-Metadata": `filename ${Buffer.from("x.html").toString("base64")},filetype ${Buffer.from("text/html").toString("base64")}`,
			},
			cookie,
		});
		const id = (create.headers.get("Location") ?? "").replace("/uploads/", "");
		const patch = await tus(`/uploads/${id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: new Uint8Array([1, 2, 3, 4]),
			cookie,
		});
		expect(patch.status).toBe(204);

		const res = await tus(`/uploads/${id}`, { method: "GET", cookie });
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("text/html");
		const csp = res.headers.get("content-security-policy") ?? "";
		const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? "";
		expect(scriptSrc).toBe("'none'");
	});

	it("rejects linking someone else's upload", async () => {
		const id = await uploadImage(cookie, "image/png");
		const res = await tus("/profile/avatar", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ uploadId: id }),
			cookie: otherCookie,
		});
		expect(res.status).toBe(404);
	});

	it("rejects linking an incomplete upload", async () => {
		const create = await tus("/uploads", {
			method: "POST",
			headers: { "Upload-Length": String(PNG.byteLength) },
			cookie,
		});
		const id = (create.headers.get("Location") ?? "").replace("/uploads/", "");
		const res = await tus("/profile/avatar", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ uploadId: id }),
			cookie,
		});
		expect(res.status).toBe(400);
	});
});

describe("google oauth stores a local avatar", () => {
	const PICTURE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG magic
	const realFetch = globalThis.fetch;

	beforeAll(() => {
		// Bun's fetch type carries extra statics (preconnect); only the call
		// signature is overridden, so the cast is safe.
		globalThis.fetch = (async (
			input: string | URL | Request,
		): Promise<Response> => {
			const u = String(input);
			if (u.includes("oauth2.googleapis.com/token")) {
				return new Response(JSON.stringify({ access_token: "test-token" }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}
			if (u.includes("www.googleapis.com/oauth2/v2/userinfo")) {
				return new Response(
					JSON.stringify({
						id: "google-1",
						email: "google-avatar@example.com",
						name: "Google Avatar",
						picture: "https://lh3.googleusercontent.com/avatar",
					}),
					{ status: 200, headers: { "content-type": "application/json" } },
				);
			}
			if (u.includes("lh3.googleusercontent.com")) {
				return new Response(PICTURE, {
					status: 200,
					headers: { "content-type": "image/jpeg" },
				});
			}
			return new Response("not mocked", { status: 404 });
		}) as typeof fetch;
	});

	afterAll(() => {
		globalThis.fetch = realFetch;
	});

	it("downloads the Google picture and serves it locally", async () => {
		// Start the flow to obtain the CSRF state cookie.
		const start = await tus("/auth/google");
		expect(start.status).toBe(302);
		const setCookie = start.headers.get("set-cookie") ?? "";
		const state = decodeURIComponent(
			(setCookie.match(/oauth_state=([^;]+)/) ?? [])[1] ?? "",
		);
		expect(state).not.toBe("");

		const cb = await tus(
			`/auth/google/callback?code=test-code&state=${encodeURIComponent(state)}`,
			{ cookie: `oauth_state=${state}` },
		);
		expect(cb.status).toBe(302);
		expect(new URL(cb.headers.get("location") ?? "").pathname).toBe(
			"/dashboard",
		);
		const cookie = sessionCookie(cb);
		expect(cookie).not.toBe("");

		// Shared props carry a local avatar URL, not the external Google URL.
		const dash = await tus("/dashboard", {
			headers: { "x-inertia": "true" },
			cookie,
		});
		const page = (await dash.json()) as {
			props: { auth: { user: { avatarUrl: string | null } } };
		};
		const avatarUrl = page.props.auth.user.avatarUrl;
		expect(avatarUrl).toMatch(/^\/uploads\//);

		// The local copy is served back with the downloaded content type.
		const img = await tus(avatarUrl ?? "", { method: "GET" });
		expect(img.status).toBe(200);
		expect(img.headers.get("content-type")).toBe("image/jpeg");
		expect(new Uint8Array(await img.arrayBuffer())).toEqual(PICTURE);
	});
});

describe("profile info & password", () => {
	let cookie: string;
	const EMAIL = "profile-form@example.com";

	beforeAll(async () => {
		cookie = await registerUser(EMAIL);
	});

	it("updates the name", async () => {
		const res = await tus("/profile", {
			method: "PATCH",
			headers: { "x-inertia": "true", "content-type": "application/json" },
			body: JSON.stringify({ name: "New Name", email: EMAIL }),
			cookie,
		});
		expect(res.status).toBe(303);

		const dash = await tus("/dashboard", {
			headers: { "x-inertia": "true" },
			cookie,
		});
		const page = (await dash.json()) as {
			props: { auth: { user: { name: string; email: string } } };
		};
		expect(page.props.auth.user.name).toBe("New Name");
		expect(page.props.auth.user.email).toBe(EMAIL);
	});

	it("rejects a duplicate email with a field error", async () => {
		await registerUser("taken-email@example.com");
		const res = await tus("/profile", {
			method: "PATCH",
			headers: { "x-inertia": "true", "content-type": "application/json" },
			body: JSON.stringify({
				name: "New Name",
				email: "taken-email@example.com",
			}),
			cookie,
		});
		expect(res.status).toBe(422);
		const data = (await res.json()) as {
			props: { errors: Record<string, string> };
		};
		expect(data.props.errors.email).toBe("That email is already registered.");
	});

	it("rejects a wrong current password", async () => {
		const res = await tus("/profile/password", {
			method: "POST",
			headers: { "x-inertia": "true", "content-type": "application/json" },
			body: JSON.stringify({
				currentPassword: "wrongpass",
				password: "newpass123",
				passwordConfirmation: "newpass123",
			}),
			cookie,
		});
		const data = (await res.json()) as {
			props: { errors: Record<string, string> };
		};
		expect(data.props.errors.currentPassword).toBe(
			"Your current password is incorrect.",
		);
	});

	it("changes the password and invalidates the old one", async () => {
		const res = await tus("/profile/password", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				currentPassword: "password123",
				password: "newpass123",
				passwordConfirmation: "newpass123",
			}),
			cookie,
		});
		expect(res.status).toBe(303);

		// Old password no longer works; the new one does.
		await tus("/logout", { method: "POST", cookie });
		const oldLogin = await tus("/login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: EMAIL, password: "password123" }),
		});
		expect(oldLogin.status).not.toBe(303);
		const newLogin = await tus("/login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: EMAIL, password: "newpass123" }),
		});
		expect(newLogin.status).toBe(303);
	});
});
