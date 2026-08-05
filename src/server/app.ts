/**
 * App composition: logging → CSRF origin check → security headers →
 * compression → inertia session → routes → error/not-found handlers.
 * Middleware runs in registration order — global middleware must precede
 * the routes they cover.
 */
import { getCookie } from "hono/cookie";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "./compress";
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
			// script-src/style-src 'unsafe-inline': Inertia embeds the page
			// payload as an inline <script type="application/json"> plus the
			// theme-boot script, and the progress bar injects inline styles.
			// For /uploads responses the content is attacker-controlled bytes
			// (served with a client-declared content-type) — script-src 'none'
			// blocks inline/external script execution there (stored-XSS guard;
			// a sandbox CSP can't be set per-path through secureHeaders).
			contentSecurityPolicy: {
				defaultSrc: ["'self'"],
				scriptSrc: [
					(c) =>
						UPLOADS_RE.test(safeUrl(c.req.url).pathname)
							? "'none'"
							: "'self' 'unsafe-inline'",
				],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", "data:"],
				fontSrc: ["'self'"],
				connectSrc: ["'self'"],
				frameAncestors: ["'none'"],
				baseUri: ["'self'"],
				formAction: ["'self'"],
			},
		}),
	);
	app.use(inertiaMiddleware(assets));

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
