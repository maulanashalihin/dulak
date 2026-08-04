/**
 * App composition: security → logging → assets → auth/inertia → routes → errors.
 * Hooks are registered in order (Elysia 1.4 applies them positionally) and
 * error/global hooks must come before the routes they cover.
 */
import { Elysia, ValidationError } from "elysia";
import { serveAsset } from "./assets";
import { readFlash, resolveUser } from "./auth";
import { db, toPublicUser } from "./db";
import { Inertia, type InertiaAssets, type InertiaContext } from "./inertia";
import { logAfter, logBefore, logError, type LogState } from "./logger";
import { authRoutes, VALIDATION_MESSAGES } from "./routes/auth.routes";
import { googleOauthRoutes } from "./routes/google-oauth.routes";
import { pageRoutes } from "./routes/pages.routes";
import { profileRoutes } from "./routes/profile.routes";
import { checkOrigin, securityHeaders } from "./security";
import { uploadsRoutes } from "./routes/uploads.routes";

/** Form routes whose schema-level validation maps back to an Inertia page. */
const COMPONENT_BY_PATH: Record<string, string> = {
	"/register": "Register",
	"/login": "Login",
	"/forgot-password": "ForgotPassword",
	"/reset-password": "ResetPassword",
};

/**
 * Build an Inertia adapter from an error context. Error handlers run even
 * when no route matched, so we resolve the session ourselves rather than
 * relying on the per-route store population.
 */
function inertiaFromContext(c: unknown, assets: InertiaAssets): Inertia {
	const ctx = c as {
		request: Request;
		headers: Record<string, string | undefined>;
		set: InertiaContext["set"];
		cookie?: Record<string, { value?: unknown } | undefined>;
	};
	const raw = ctx.cookie?.session?.value;
	const sessionToken = typeof raw === "string" && raw.length > 0 ? raw : null;
	// For unmatched routes Elysia's runtime error context omits `headers`.
	const headers =
		ctx.headers ?? Object.fromEntries(ctx.request.headers.entries());
	const row = resolveUser(sessionToken);
	return new Inertia(
		{
			request: ctx.request,
			headers,
			set: ctx.set,
			user: row ? toPublicUser(row) : null,
			flash: readFlash(sessionToken),
			sessionToken,
		},
		assets,
	);
}

export function createApp(assets: InertiaAssets) {
	return new Elysia()
		.state("requestStart", 0 as number)
		.state("requestId", "" as string)
		.onBeforeHandle(logBefore)
		.onBeforeHandle(checkOrigin)
		.onError((c) => {
			const { code, error, request, set } = c;
			logError({ store: c.store, request, error });

			const pathname = new URL(request.url).pathname;

			// tus endpoints speak JSON + tus headers, never Inertia pages.
			if (pathname === "/uploads" || pathname.startsWith("/uploads/")) {
				set.status = 500;
				set.headers["content-type"] = "application/json";
				set.headers["Tus-Resumable"] = "1.0.0";
				return JSON.stringify({ error: "Internal Server Error" });
			}

			// Schema validation (TypeBox) → 422 with field errors, Inertia-aware.
			if (code === "VALIDATION" && error instanceof ValidationError) {
				const component = COMPONENT_BY_PATH[pathname];
				const errors: Record<string, string> = {};
				for (const item of error.all) {
					const field = item.path.replace(/^\//, "");
					if (field && !errors[field])
						errors[field] = VALIDATION_MESSAGES[item.path] ?? item.message;
				}
				if (!component) {
					set.status = 422;
					return JSON.stringify({ errors });
				}
				return inertiaFromContext(c, assets).error(component, errors);
			}

			// 404 → render the NotFound page (SSR for browsers, JSON for XHR).
			if (code === "NOT_FOUND") {
				return inertiaFromContext(c, assets).render(
					"NotFound",
					{},
					{ status: 404 },
				);
			}

			set.status = 500;
			return "Internal Server Error";
		})
		.onAfterHandle(logAfter)
		.onAfterHandle(securityHeaders)
		.get("/health", () => {
			db.query("SELECT 1").get();
			return { status: "ok", uptime: process.uptime() };
		})
		.get("/assets/*", ({ params }) => serveAsset(params["*"]))
		.use(uploadsRoutes())
		.use(authRoutes(assets))
		.use(googleOauthRoutes(assets))
		.use(pageRoutes(assets))
		.use(profileRoutes(assets));
}
