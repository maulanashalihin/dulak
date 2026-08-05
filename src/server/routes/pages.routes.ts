/**
 * Page routes: the Inertia app-shell pages (/, /dashboard, /admin).
 * Feature pages get their own `<feature>.routes.ts` — see AGENTS.md
 * "Route conventions".
 */
import { Hono } from "hono";
import { requireAuth, requireRole } from "../auth";
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

	app.get("/", (c) =>
		c.var.inertia.redirect(c.var.user ? "/dashboard" : "/login", 302),
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
