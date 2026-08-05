/**
 * Bun.build plugin: compile .svelte components and .svelte.js modules.
 *
 * Svelte 5 runes ($state, $props, $derived, $effect) are compiler macros —
 * not valid JS at runtime. @inertiajs/svelte ships .svelte.js files that
 * contain runes (useForm.svelte.js, page.svelte.js). Without this plugin,
 * Bun errors: "$state is not defined".
 *
 * Two onLoad handlers:
 *  - .svelte       = components (markup + script + style)
 *  - .svelte.js/ts = JS modules with runes
 */
import { compile, compileModule } from "svelte/compiler";
import type { BunPlugin, OnLoadArgs } from "bun";

export function sveltePlugin(
	generate: "client" | "server" = "client",
): BunPlugin {
	return {
		name: `svelte-${generate}`,
		setup(build) {
			build.onLoad({ filter: /\.svelte$/ }, async (args: OnLoadArgs) => {
				const source = await Bun.file(args.path).text();
				const name = args.path
					.split("/")
					.pop()!
					.replace(/\.svelte$/, "");
				const result = compile(source, { generate, name, css: "external" });
				return { contents: result.js.code, loader: "js" };
			});
			build.onLoad({ filter: /\.svelte\.[jt]s$/ }, async (args: OnLoadArgs) => {
				const source = await Bun.file(args.path).text();
				const result = compileModule(source, { generate, filename: args.path });
				return { contents: result.js.code, loader: "js" };
			});
		},
	};
}
