/**
 * Client entry. Bootstraps Inertia v3 + Vue 3.
 * When the page was server-rendered (data-server-rendered attribute) the app
 * is created with createSSRApp, whose mount() hydrates; otherwise a plain
 * client render.
 */
import { createInertiaApp } from "@inertiajs/vue3";
import type { DefineComponent } from "vue";
import { createApp, createSSRApp, h } from "vue";
import "./styles.css"; // global base: tokens, reset, shared UI primitives
import { notFoundPage, pages } from "./pages";

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
