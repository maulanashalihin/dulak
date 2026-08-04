/**
 * Page routes: the Inertia app-shell pages (/, /dashboard, /admin).
 * Feature pages get their own `<feature>.routes.ts` — see AGENTS.md
 * "Route conventions".
 */
import { Elysia, t } from "elysia";
import { requireAuth, requireRole } from "../auth";
import { countUsers, listUsers, recentUsers, toPublicUser } from "../db";
import { inertiaPlugin, makePopulateStore } from "../inertia-plugin";
import type { InertiaAssets } from "../inertia";
import type { DashboardStats, Paginated, User } from "../../shared/types";

function dashboardStats(): DashboardStats {
	return {
		userCount: countUsers.get()?.n ?? 0,
		recentUsers: recentUsers.all(5).map(toPublicUser),
	};
}

const adminQuery = t.Object({
	page: t.Optional(t.Number()),
	perPage: t.Optional(t.Number()),
});

export const pageRoutes = (assets: InertiaAssets) =>
	new Elysia()
		.use(inertiaPlugin(assets))
		.onBeforeHandle(makePopulateStore(assets))
		.get("/", ({ store }) =>
			store.inertia.redirect(store.user ? "/dashboard" : "/login", 302),
		)
		.get(
			"/dashboard",
			({ store }) =>
				store.inertia.render("Dashboard", { stats: dashboardStats() }),
			{ beforeHandle: requireAuth },
		)
		.get(
			"/admin",
			({ store, query }) => {
				const page = Math.max(1, Number(query.page ?? 1) || 1);
				const perPage = Math.min(
					100,
					Math.max(1, Number(query.perPage ?? 10) || 10),
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
				return store.inertia.render("Admin", { users });
			},
			{ beforeHandle: requireRole("admin"), query: adminQuery },
		);
