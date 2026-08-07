/**
 * In-process SSR renderer. Runs inside the Hono process (no separate
 * SSR server): renders the page component tree to HTML with react-dom/server.
 */
import { createInertiaApp } from "@inertiajs/react";
import type { Page } from "@inertiajs/core";
import { renderToString } from "react-dom/server";
// Tracked by Bun --watch so editing the global stylesheet triggers an asset
// rebuild. No-op at runtime; the real CSS import lives in app.tsx (client bundle).
import "./styles.css";
import { notFoundPage, pages } from "./pages";

export async function renderPage(page: Page) {
	return createInertiaApp({
		page,
		render: renderToString,
		resolve: (name) => pages[`./pages/${name}.tsx`]?.default ?? notFoundPage!,
		setup: ({ App, props }) => <App {...props} />,
		title: (title: string) =>
			title ? `${title} — Dulak` : "Dulak",
	});
}
