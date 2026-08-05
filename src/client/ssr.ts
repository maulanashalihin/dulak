/**
 * In-process SSR renderer. Runs inside the Hono process (no separate
 * SSR server): renders the page component tree to HTML with svelte/server.
 *
 * This file is pre-built to dist/ssr.js by buildClientAssets() because
 * @inertiajs/svelte only exports under the `svelte` condition, which
 * Bun.build can resolve via `conditions: ['svelte']` but the Bun runtime
 * cannot. The Svelte compiler (generate: 'server') is applied via the
 * svelte plugin during the build.
 */
import { createInertiaApp } from "@inertiajs/svelte";
import { render } from "svelte/server";
import type { Page } from "@inertiajs/core";
import { notFoundPage, pages } from "./pages";

const renderFn = await createInertiaApp({
	resolve: (name: string) => pages[`./pages/${name}.svelte`] ?? notFoundPage,
});

export async function renderPage(page: Page) {
	if (typeof renderFn !== "function") {
		throw new Error("SSR render function not initialized");
	}
	return renderFn(page as unknown as Parameters<typeof renderFn>[0], render);
}
