// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mdx from "@astrojs/mdx";

// `site` is used for canonical URLs — set it to the production domain
// (e.g. https://dulak.pages.dev) before deploying.
export default defineConfig({
	site: "https://dulak.pages.dev",
	integrations: [
		starlight({
			title: "Dulak",
			description:
				"Deliberately boring full-stack boilerplate: Hono + bun:sqlite + Inertia v3 on Bun, with React/Svelte/Vue + Tailwind templates.",
			favicon: "/favicon.svg",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/maulanashalihin/dulak",
				},
			],
			customCss: ["./src/styles/custom.css"],
			sidebar: [
				{
					label: "Getting Started",
					items: [
						{ label: "Introduction", slug: "getting-started/introduction" },
						{ label: "Installation", slug: "getting-started/installation" },
					],
				},
				{
					label: "Architecture",
					items: [
						{ label: "Overview", slug: "architecture/overview" },
						{ label: "Conventions", slug: "architecture/conventions" },
						{
							label: "Request lifecycle",
							slug: "architecture/request-lifecycle",
						},
					],
				},
				{
					label: "Auth",
					items: [
						{ label: "Sessions & guards", slug: "auth/sessions-guards" },
						{ label: "Google OAuth", slug: "auth/google-oauth" },
						{ label: "Password reset", slug: "auth/password-reset" },
					],
				},
				{
					label: "Uploads",
					items: [{ label: "tus resumable upload", slug: "uploads/tus" }],
				},
				{
					label: "Deployment",
					items: [
						{ label: "Configuration", slug: "deployment/configuration" },
						{ label: "Docker", slug: "deployment/docker" },
					],
				},
				{
					label: "Templates",
					items: [
						{ label: "react-tailwind", slug: "templates/react-tailwind" },
						{ label: "svelte-tailwind", slug: "templates/svelte-tailwind" },
						{ label: "vue-tailwind", slug: "templates/vue-tailwind" },
					],
				},
				{ label: "Contributing", slug: "contributing" },
			],
		}),
		mdx(),
	],
});
