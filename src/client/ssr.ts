/**
 * In-process SSR renderer. Runs inside the Hono process (no separate
 * SSR server): renders the page component tree to HTML via
 * @vue/server-renderer. This module is bundled separately to dist/ssr.js
 * with the Vue plugin (see src/server/assets.ts) and loaded lazily by
 * src/server/inertia.ts.
 */
import { createInertiaApp } from "@inertiajs/vue3";
import type { Page } from "@inertiajs/core";
import { renderToString } from "@vue/server-renderer";
import type { DefineComponent } from "vue";
import { createSSRApp, h } from "vue";
import { notFoundPage, pages } from "./pages";

export async function renderPage(page: Page) {
	return createInertiaApp({
		page,
		render: (app) => renderToString(app),
		resolve: (name) =>
			(pages[`./pages/${name}.vue`]?.default ?? notFoundPage) as DefineComponent,
		setup({ App, props, plugin }) {
			return createSSRApp({ render: () => h(App, props) }).use(plugin);
		},
		title: (title: string) =>
			title ? `${title} — Hono Inertia` : "Hono Inertia",
	});
}
