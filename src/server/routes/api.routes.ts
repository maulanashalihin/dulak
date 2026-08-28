/**
 * Client-side data API. Decouples user/session data from Inertia page
 * payloads so public page HTML stays identical for all visitors and can
 * be cached at the CDN edge (Cloudflare).
 *
 *   GET /api/session → { user, flash }  (clears flash)
 *
 * The client calls this once on boot (see `src/client/session.ts`).
 * Public page components read user identity from the session store, not
 * from Inertia page props. Auth pages still receive `auth.user` via
 * Inertia props directly — this endpoint is only for cacheable public pages.
 *
 * All responses are `Cache-Control: private, no-store` — never cached at
 * the edge.
 */
import { Hono } from "hono";
import { clearFlash } from "../auth";
import { noStore } from "../cache";
import type { AppEnv } from "../inertia-middleware";
import type { FlashData, User } from "../../shared/types";

export const apiRoutes = () => {
	const app = new Hono<AppEnv>();

	app.get("/api/session", noStore, (c) => {
		const user: User | null = c.var.user;
		const flash: FlashData = c.var.flash;
		if (c.var.sessionToken) clearFlash(c.var.sessionToken);
		return c.json({ user, flash });
	});

	return app;
};
