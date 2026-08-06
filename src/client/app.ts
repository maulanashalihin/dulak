/**
 * Client entry. Bootstraps Inertia v3 + Svelte 5.
 * When the page was server-rendered (data-server-rendered attribute) we
 * hydrate; otherwise we do a plain client mount.
 */
import { createInertiaApp } from "@inertiajs/svelte";
import { mount, hydrate } from "svelte";
import "./styles.css";
import { notFoundPage, pages } from "./pages";

const resolve = (name: string) =>
	pages[`./pages/${name}.svelte`] ?? notFoundPage;

createInertiaApp({
	id: "app",
	resolve,
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
