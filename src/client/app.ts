/**
 * Client entry. Bootstraps Inertia v3 + Vue 3.
 * When the page was server-rendered (data-server-rendered attribute) the app
 * is created with createSSRApp, whose mount() hydrates; otherwise a plain
 * client render.
 *
 * On boot, fetches user identity via `GET /api/session` — decoupled from
 * Inertia page props so public page HTML stays identical for all visitors
 * (CDN-cacheable). Public page components read user state from the session
 * store (`session`), not from Inertia props.
 *
 * SPA cache-key separation: Inertia XHR navigations get `?_spa=1` appended
 * so Cloudflare caches the JSON response under a separate key from the
 * HTML. After navigation, the param is stripped from the address bar so
 * reloads/bookmarks hit the HTML cache.
 */
import { createInertiaApp, router } from "@inertiajs/vue3";
import type { DefineComponent } from "vue";
import { createApp, createSSRApp, h } from "vue";
import "./styles.css"; // global base: tokens, reset, shared UI primitives
import { notFoundPage, pages } from "./pages";
import { loadSession } from "./session";

// Fetch user session once on boot — decoupled from Inertia page props so
// public page HTML stays identical for all visitors (CDN-cacheable).
void loadSession();

// CDN cache strategy: add ?_spa=1 to SPA navigations so Cloudflare caches
// the JSON response separately from the HTML (different cache key). After
// navigation, strip the param from the address bar so reloads/bookmarks
// hit the HTML cache, not the JSON cache.
router.on("before", (event) => {
	const url = new URL(event.detail.visit.url);
	url.searchParams.set("_spa", "1");
	event.detail.visit.url = url;
});
router.on("success", () => {
	const url = new URL(window.location.href);
	if (url.searchParams.has("_spa")) {
		url.searchParams.delete("_spa");
		window.history.replaceState(window.history.state, "", url.toString());
	}
});

createInertiaApp({
	id: "app",
	resolve: (name) =>
		(pages[`./pages/${name}.vue`]?.default ?? notFoundPage) as DefineComponent,
	setup({ el, App, props, plugin }) {
		const hydrate = el.hasAttribute("data-server-rendered");
		const app = (hydrate ? createSSRApp : createApp)({
			render: () => h(App, props),
		});
		app.use(plugin);
		return app;
	},
	title: (title: string) =>
		title ? `${title} — Dulak` : "Dulak",
	progress: { color: "#059669" },
});
