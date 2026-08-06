/**
 * Client entry. Bootstraps Inertia v3 + React 19.
 * When the page was server-rendered (data-server-rendered attribute) we
 * hydrate; otherwise we do a plain client render.
 */
import { createInertiaApp } from "@inertiajs/react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles.css";
import { notFoundPage, pages } from "./pages";

const resolve = (name: string) =>
	pages[`./pages/${name}.tsx`]?.default ?? notFoundPage!;

createInertiaApp({
	id: "app",
	resolve,
	setup({ el, App, props }) {
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
