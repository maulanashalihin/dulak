/**
 * Client entry. Bootstraps Inertia v3 + Svelte 5.
 * When the page was server-rendered (data-server-rendered attribute) we
 * hydrate; otherwise we do a plain client mount.
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
import { createInertiaApp, router } from "@inertiajs/svelte";
import { mount, hydrate } from "svelte";
import { notFoundPage, pages } from "./pages";
import { loadSession } from "./session";
import "./.tailwind.css";
import "./styles.css";

const resolve = (name: string) =>
	pages[`./pages/${name}.svelte`] ?? notFoundPage;

/** Read the CSP nonce from the <meta name="csp-nonce"> tag set by the server.
 *  Used by Inertia for inline styles (progress bar, error modal) so they
 *  pass a strict CSP without 'unsafe-inline'. */
const cspNonce =
	document.querySelector('meta[name="csp-nonce"]')?.getAttribute("content") ??
	undefined;

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
	resolve,
	nonce: cspNonce,
	setup({ el, App, props }) {
		if (!el) throw new Error("Root element #app not found");
		if (el.hasAttribute("data-server-rendered")) {
			hydrate(App, { target: el, props });
		} else {
			mount(App, { target: el, props });
		}
	},
	progress: { color: "#059669" },
});
