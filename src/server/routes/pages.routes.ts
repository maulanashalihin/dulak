/**
 * Page routes: the Inertia app-shell pages (/, /dashboard, /admin).
 * Feature pages get their own `<feature>.routes.ts` — see AGENTS.md
 * "Route conventions".
 *
 * `/` is a **public, CDN-cacheable** page: rendered with `{ public: true }`
 * so the HTML contains no user-specific data. Cloudflare caches the
 * response (s-maxage=300, SWR=600). The client fetches user identity via
 * `GET /api/session` after hydration. Auth pages (/dashboard, /admin) are
 * private and never cached.
 */
import { Hono } from "hono";
import { requireAuth, requireRole } from "../auth";
import { cacheablePublic } from "../cache";
import { countUsers, listUsers, recentUsers, toPublicUser } from "../db";
import type { AppEnv } from "../inertia-middleware";
import type { DashboardStats, Paginated, User } from "../../shared/types";

function dashboardStats(): DashboardStats {
	return {
		userCount: countUsers.get()?.n ?? 0,
		recentUsers: recentUsers.all(5).map(toPublicUser),
	};
}

export const pageRoutes = () => {
	const app = new Hono<AppEnv>();

	// Public landing page — CDN-cacheable (5 min TTL, 10 min SWR).
	// Rendered with { public: true } so no auth.user in the page props;
	// the client fetches user identity via GET /api/session.
	app.use("/", cacheablePublic(300, 600));
	app.get("/", (c) =>
		c.var.inertia.render("Home", {}, { public: true }),
	);
	app.get("/dashboard", requireAuth, (c) =>
		c.var.inertia.render("Dashboard", { stats: dashboardStats() }),
	);
	app.get("/admin", requireRole("admin"), (c) => {
		const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
		const perPage = Math.min(
			100,
			Math.max(1, Number(c.req.query("perPage") ?? 10) || 10),
		);
		const total = countUsers.get()?.n ?? 0;
		const users: Paginated<User> = {
			data: listUsers.all(perPage, (page - 1) * perPage).map(toPublicUser),
			meta: {
				currentPage: page,
				perPage,
				lastPage: Math.max(1, Math.ceil(total / perPage)),
				total,
			},
		};
		return c.var.inertia.render("Admin", { users });
	});

	return app;
};
