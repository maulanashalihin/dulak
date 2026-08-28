/**
 * Client entry. Bootstraps Inertia v3 + React 19.
 * When the page was server-rendered (data-server-rendered attribute) we
 * hydrate; otherwise we do a plain client render.
 *
 * On boot, fetches user identity via `GET /api/session` — decoupled from
 * Inertia page props so public page HTML stays identical for all visitors
 * (CDN-cacheable). Public page components read user state from the session
 * store (`useSession()`), not from Inertia props.
 *
 * SPA cache-key separation: Inertia XHR navigations get `?_spa=1` appended
 * so Cloudflare caches the JSON response under a separate key from the
 * HTML. After navigation, the param is stripped from the address bar so
 * reloads/bookmarks hit the HTML cache.
 */
import { createInertiaApp, router } from "@inertiajs/react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles.css";
import { notFoundPage, pages } from "./pages";
import { loadSession } from "./session";

const resolve = (name: string) =>
	pages[`./pages/${name}.tsx`]?.default ?? notFoundPage!;

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
	// React Strict Mode (dev-only, no-op in production): catches unsafe
	// lifecycles, double-render bugs, and legacy context API usage.
	strictMode: true,
	setup({ el, App, props }) {
		if (!el) return;
		const element = <App {...props} />;
		if (el.hasAttribute("data-server-rendered")) {
			hydrateRoot(el, element);
		} else {
			createRoot(el).render(element);
		}
	},
	title: (title: string) =>
		title ? `${title} — Dulak` : "Dulak",
});
