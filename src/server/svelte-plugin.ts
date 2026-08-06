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
 *
 * `<style>` blocks are compiled with `css: "external"`; the emitted CSS is
 * written to a project-local cache and re-imported so Bun.build bundles
 * every component's scoped CSS into one output stylesheet. An onResolve
 * handler intercepts those cache imports (absolute paths can confuse
 * Bun's default resolver under symlinked worktrees) and maps them to the
 * real on-disk path.
 */
import { compile, compileModule } from "svelte/compiler";
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BunPlugin, OnLoadArgs, OnResolveArgs } from "bun";

const CSS_CACHE_DIR = resolve(import.meta.dir, "../../.svelte-css-cache");
mkdirSync(CSS_CACHE_DIR, { recursive: true });

export function sveltePlugin(
	generate: "client" | "server" = "client",
): BunPlugin {
	return {
		name: `svelte-${generate}`,
		setup(build) {
			// Intercept CSS-cache imports and resolve them to the real path,
			// bypassing Bun's default resolver (which can fail on absolute
			// paths under symlinked worktrees).
			build.onResolve(
				{ filter: /\.svelte-css-cache\/.*\.svelte\.css$/ },
				(args: OnResolveArgs) => ({ path: realpathSync(args.path) }),
			);
			build.onLoad({ filter: /\.svelte$/ }, async (args: OnLoadArgs) => {
				const source = await Bun.file(args.path).text();
				const name = args.path
					.split("/")
					.pop()!
					.replace(/\.svelte$/, "");
				const result = compile(source, { generate, name, css: "external" });
				let code = result.js.code;
				if (generate === "client" && result.css?.code) {
					const cssPath = `${CSS_CACHE_DIR}/${name}.svelte.css`;
					writeFileSync(cssPath, result.css.code);
					code += `\nimport ${JSON.stringify(cssPath)};\n`;
				}
				return { contents: code, loader: "js" };
			});
			build.onLoad({ filter: /\.svelte\.[jt]s$/ }, async (args: OnLoadArgs) => {
				const source = await Bun.file(args.path).text();
				const result = compileModule(source, { generate, filename: args.path });
				return { contents: result.js.code, loader: "js" };
			});
		},
	};
}
