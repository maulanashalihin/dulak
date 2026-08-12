/**
 * App composition: logging → CSRF origin check → security headers →
 * compression → inertia session → global rate limit → routes → error/not-found handlers.
 * Middleware runs in registration order — global middleware must precede
 * the routes they cover.
 */
import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "./compress";
import { config } from "./config";
import { rateLimit } from "./rate-limit";
import { readFlash, resolveUser, SESSION_COOKIE } from "./auth";
import { serveAsset } from "./assets";
import { pingDb, toPublicUser } from "./db";
import { Inertia, type InertiaAssets } from "./inertia";
import { inertiaMiddleware, type AppEnv } from "./inertia-middleware";
import { logError, requestLogger } from "./logger";
import { authRoutes, VALIDATION_MESSAGES } from "./routes/auth.routes";
import { googleOauthRoutes } from "./routes/google-oauth.routes";
import { pageRoutes } from "./routes/pages.routes";
import {
	profileRoutes,
	PROFILE_VALIDATION_MESSAGES,
} from "./routes/profile.routes";
import { uploadsRoutes } from "./routes/uploads.routes";
import { checkOrigin } from "./security";
import { safeUrl } from "./url";
import { ValidationFailed } from "./validation";
import type { Context } from "hono";

/** Form routes whose schema-level validation maps back to an Inertia page. */
const COMPONENT_BY_PATH: Record<string, string> = {
	"/register": "Register",
	"/login": "Login",
	"/forgot-password": "ForgotPassword",
	"/reset-password": "ResetPassword",
	"/profile": "Profile",
	"/profile/password": "Profile",
};

const VALIDATION_MESSAGES_ALL = {
	...VALIDATION_MESSAGES,
	...PROFILE_VALIDATION_MESSAGES,
};

const isUploadsPath = (pathname: string) =>
	pathname === "/uploads" || pathname.startsWith("/uploads/");

const UPLOADS_RE = /^\/uploads(\/|$)/;

/**
 * Build the Inertia adapter for error/not-found paths. The global
 * inertiaMiddleware has already run for every request, so `c.var.inertia`
 * is normally set; the fallback only covers exotic failures before it ran.
 */
function inertiaFromContext(
	c: Context<AppEnv>,
	assets: InertiaAssets,
): Inertia {
	const existing = c.get("inertia");
	if (existing) return existing;
	const raw = getCookie(c, SESSION_COOKIE);
	const sessionToken = typeof raw === "string" && raw.length > 0 ? raw : null;
	const row = resolveUser(sessionToken);
	return new Inertia(
		{
			request: c.req.raw,
			headers: Object.fromEntries(c.req.raw.headers.entries()),
			user: row ? toPublicUser(row) : null,
			flash: readFlash(sessionToken),
			sessionToken,
			cspNonce: c.get("cspNonce") ?? "",
		},
		assets,
	);
}

export function createApp(assets: InertiaAssets) {
	const app = new Hono<AppEnv>();

	app.use(requestLogger);
	app.use(checkOrigin);
	// gzip-compress compressible responses (HTML/CSS/JS/JSON) above 1KB.
	// Custom zlib-based middleware — hono's built-in needs the CompressionStream
	// Web API, which is not reliably present in every Bun 1.3.14 context.
	app.use(compress());
	app.use(
		secureHeaders({
			xFrameOptions: "DENY",
			referrerPolicy: "strict-origin-when-cross-origin",
			permissionsPolicy: { camera: [], microphone: [], geolocation: [] },
			// CSP is set per-request below (needs the per-request nonce from
			// inertiaMiddleware) — not here, where it would be static.
		}),
	);
	app.use(inertiaMiddleware(assets));
	// Per-request CSP with nonce — must run after inertiaMiddleware (which
	// generates the nonce). Inline scripts (theme boot, page payload) and
	// inline styles (Inertia progress bar) carry the nonce; 'unsafe-inline'
	// is no longer needed. /uploads responses get script-src 'none' (stored-XSS
	// guard: content is attacker-controlled bytes with client-declared content-type).
	app.use(async (c, next) => {
		await next();
		const nonce = c.get("cspNonce");
		const isUploads = UPLOADS_RE.test(safeUrl(c.req.url).pathname);
		const csp = [
			`default-src 'self'`,
			isUploads
				? `script-src 'none'`
				: `script-src 'self' 'nonce-${nonce}'`,
			`style-src 'self' 'nonce-${nonce}'`,
			`img-src 'self' data:`,
			`font-src 'self'`,
			`connect-src 'self'`,
			`frame-ancestors 'none'`,
			`base-uri 'self'`,
			`form-action 'self'`,
		].join("; ");
		c.res.headers.set("content-security-policy", csp);
	});
	// Global rate limit (DDoS baseline) — applied to all routes except
	// /health (orchestrator probes), /assets/* (bulk browser fetches), and
	// /.well-known/* (DevTools probes). Auth endpoints get a stricter layer
	// on top (see auth.routes.ts). The limiter is instantiated once so its
	// bucket map persists across requests.
	const globalLimiter = rateLimit({
		max: config.rateLimit.globalMax,
		windowSeconds: config.rateLimit.globalWindow,
	});
	const EXEMPT_PREFIXES = ["/assets/", "/.well-known/"] as const;
	app.use((c, next) => {
		const pathname = safeUrl(c.req.url).pathname;
		if (pathname === "/health" || EXEMPT_PREFIXES.some((p) => pathname.startsWith(p)))
			return next();
		return globalLimiter(c, next);
	});

	app.onError(async (err, c) => {
		logError(c, err);
		const pathname = safeUrl(c.req.url).pathname;

		if (err instanceof HTTPException) return err.getResponse();

		// tus endpoints speak JSON + tus headers, never Inertia pages.
		if (isUploadsPath(pathname)) {
			c.header("content-type", "application/json");
			c.header("Tus-Resumable", "1.0.0");
			return c.json({ error: "Internal Server Error" }, 500);
		}

		// Schema validation (TypeBox) → 422 with field errors, Inertia-aware.
		if (err instanceof ValidationFailed) {
			const component = COMPONENT_BY_PATH[pathname];
			const errors: Record<string, string> = {};
			for (const item of err.errors) {
				const field = item.path.replace(/^\//, "");
				if (field && !errors[field])
					errors[field] = VALIDATION_MESSAGES_ALL[item.path] ?? item.message;
			}
			if (!component) return c.json({ errors }, 422);
			return inertiaFromContext(c, assets).error(component, errors);
		}

		return c.text("Internal Server Error", 500);
	});

	app.notFound((c) => {
		const pathname = safeUrl(c.req.url).pathname;
		// Unmatched /uploads routes (e.g. PUT) stay JSON, not Inertia pages.
		if (isUploadsPath(pathname)) {
			return c.json({ error: "Not found" }, 404);
		}
		return inertiaFromContext(c, assets).render(
			"NotFound",
			{},
			{ status: 404 },
		);
	});

	app.get("/health", (c) => {
		pingDb.get();
		return c.json({ status: "ok", uptime: process.uptime() });
	});
	// Hono's tail wildcard produces no named param — derive the relative
	// path from c.req.path (see uploads.routes.ts for the same pattern).
	app.get("/assets/*", (c) => {
		const relPath = c.req.path.slice("/assets/".length);
		return serveAsset(relPath);
	});
	// Browser/DevTools well-known probes (e.g. Chrome DevTools JSON) —
	// return a plain 404 so they never reach the Inertia not-found handler.
	app.get("/.well-known/*", () => new Response(null, { status: 404 }));

	app.route("/uploads", uploadsRoutes());
	app.route("/", authRoutes());
	app.route("/", googleOauthRoutes());
	app.route("/", pageRoutes());
	app.route("/", profileRoutes());

	return app;
}
