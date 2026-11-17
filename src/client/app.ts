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
 * SPA navigations carry this bundle's version as `?_spa=1&v=<hash>`
 * (stock XHR otherwise). The edge key then pins one generation per entry:
 * a pre-deploy payload can never be served to a new bundle, so versioned
 * JSON is safely cacheable. The server only marks the payload cacheable
 * when `v` equals its own version (stray/foreign keys stay no-store), and
 * `page.url` never contains either param. See inertia.ts.
 */
import { createInertiaApp, router } from "@inertiajs/svelte";
import { mount, hydrate } from "svelte";
import "./styles.css";
import { notFoundPage, pages } from "./pages";
import { loadSession } from "./session";

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

// Version-keyed edge cache: every XHR carries this bundle's version so
// each generation gets its own key (a stale payload can never be served
// to a new bundle — the key simply won't match). `?_spa` stays as the
// JSON/HTML separator for the server's canonical guards. Seeded from the
// booted page, refreshed on every successful visit.
let currentVersion: string | undefined;
router.on("before", (event) => {
	const url = new URL(event.detail.visit.url);
	url.searchParams.set("_spa", "1");
	if (currentVersion) url.searchParams.set("v", currentVersion);
	event.detail.visit.url = url;
});
router.on("success", (event) => {
	const page = event.detail.page as unknown as { version?: unknown };
	if (typeof page.version === "string" && page.version.length > 0) {
		currentVersion = page.version;
	}
	const url = new URL(window.location.href);
	if (url.searchParams.has("_spa") || url.searchParams.has("v")) {
		url.searchParams.delete("_spa");
		url.searchParams.delete("v");
		window.history.replaceState(window.history.state, "", url.toString());
	}
});

createInertiaApp({
	id: "app",
	resolve,
	nonce: cspNonce,
	setup({ el, App, props }) {
		if (!el) throw new Error("Root element #app not found");
		// Seed the version-keyed cache from the booted page (covers the
		// very first visit, before any success event fires). setup's
		// `props` is the inner page props — the version lives in the
		// inlined data-page JSON next to the mount point.
		const booted = props as unknown as { version?: unknown };
		if (typeof booted.version === "string" && booted.version.length > 0) {
			currentVersion = booted.version;
		} else {
			try {
				// Script tag (clientBody) or div attribute (core SSR body)
				// — whichever the server rendered.
				const raw =
					document.querySelector('script[data-page="app"]')
						?.textContent ??
					document.getElementById("app")?.getAttribute("data-page") ??
					undefined;
				const v = raw
					? (JSON.parse(raw) as { version?: unknown }).version
					: undefined;
				if (typeof v === "string" && v.length > 0) currentVersion = v;
			} catch {
				// Malformed payload — visits simply omit ?v and the
				// server answers no-store (safe fallback).
			}
		}
		if (el.hasAttribute("data-server-rendered")) {
			hydrate(App, { target: el, props });
		} else {
			mount(App, { target: el, props });
		}
	},
	progress: { color: "#059669" },
});
