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
 */
import { createHash } from "node:crypto";
import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc";

export function vuePlugin() {
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
				if (descriptor.styles.length > 0) {
					throw new Error(
						`<style> in SFC is not supported by this build (${filename}) — use global styles`,
					);
				}
				if (descriptor.script && !descriptor.scriptSetup) {
					throw new Error(
						`Only <script setup> is supported (${filename})`,
					);
				}

				let code = "";
				if (descriptor.scriptSetup) {
					const script = compileScript(descriptor, { id });
					code += script.content + "\n";
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
						code += template.code + "\n";
						// Attach the compiled render to the component.
						code = code.replace(
							/export default (?=\/\*@__PURE__\*\/_defineComponent\()/,
							"const __sfc__ = ",
						);
						code += "__sfc__.render = render;\nexport default __sfc__;\n";
					}
				}
				return { contents: code, loader: "ts" };
			});
		},
	};
}
