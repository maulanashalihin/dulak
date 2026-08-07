/**
 * Bun.build plugin: compile Vue SFCs (`<script setup lang="ts">`) with
 * @vue/compiler-sfc. Render functions are isomorphic, so one plugin serves
 * both the client (browser) and SSR (bun) builds.
 *
 * Assembly: compileScript emits `export default _defineComponent({...})`
 * (no `__sfc__` const in compiler-sfc 3.5); the compiled template's
 * `export function render` is attached to that component via a rename +
 * `__sfc__.render = render`. `bindingMetadata` from compileScript makes the
 * template resolve script-setup bindings through `$setup`/`$props`.
 *
 * `<style>` / `<style scoped>` blocks are compiled with compileStyle, written
 * to temp `.css` files, and appended as `import "<path>"` statements. Bun.build
 * bundles these imports into the single output stylesheet (scoped selectors
 * carry the `data-v-xxxx` attribute id derived from the filename hash).
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { compileScript, compileStyle, compileTemplate, parse } from "@vue/compiler-sfc";

const TMP_CSS_DIR = "/tmp/dulak-vue-css";
mkdirSync(TMP_CSS_DIR, { recursive: true });

export function vuePlugin({ ssr = false }: { ssr?: boolean } = {}) {
	return {
		name: "vue-plugin",
		setup(build: any) {
			build.onLoad({ filter: /\.vue$/ }, async (args: any) => {
				const filename = args.path;
				const source = await Bun.file(filename).text();
				const id = `data-v-${createHash("sha256")
					.update(filename)
					.digest("hex")
					.slice(0, 8)}`;
				const { descriptor, errors } = parse(source, { filename });
				if (errors.length > 0)
					throw new Error(errors.map((e) => e.message).join("\n"));
				if (descriptor.script && !descriptor.scriptSetup) {
					throw new Error(
						`Only <script setup> is supported (${filename})`,
					);
				}

				let code = "";
				if (descriptor.scriptSetup) {
					const script = compileScript(descriptor, { id });
					code += `${script.content}\n`;
					if (descriptor.template) {
						const template = compileTemplate({
							source: descriptor.template.content,
							filename,
							id,
							compilerOptions: {
								bindingMetadata: script.bindings,
							},
						});
						if (template.errors.length > 0)
							throw new Error(
								template.errors.map(String).join("\n"),
							);
						code += `${template.code}\n`;
						// Attach the compiled render to the component.
						code = code.replace(
							/export default (?=\/\*@__PURE__\*\/_defineComponent\()/,
							"const __sfc__ = ",
						);
						code += "__sfc__.render = render;\nexport default __sfc__;\n";
					}
				}

			// Compile each <style> block to a temp .css file and import it so
			// Bun.build bundles the styles into the client output stylesheet.
			// Skipped for the SSR build (target: "bun" can't resolve .css imports
			// and the CSS is already in the client bundle, loaded via <link>).
			if (!ssr) {
				for (const style of descriptor.styles) {
					const compiled = compileStyle({
						source: style.content,
						filename,
						id,
						scoped: style.scoped,
					});
					if (compiled.errors.length > 0)
						throw new Error(
							compiled.errors.map((e) => String(e)).join("\n"),
						);
					const base = filename.split("/").pop()!.replace(/\.vue$/, "");
					const cssPath = `${TMP_CSS_DIR}/${base}.vue.css`;
					writeFileSync(cssPath, compiled.code);
					code += `\nimport "${cssPath}";\n`;
				}
			}

			return { contents: code, loader: "ts" };
			});
		},
	};
}
