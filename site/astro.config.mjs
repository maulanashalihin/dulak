// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightBlog from "starlight-blog";
import mdx from "@astrojs/mdx";

// `site` is used for canonical URLs — set it to the production domain
// (e.g. https://dulak.pages.dev) before deploying.
export default defineConfig({
	site: "https://dulak.pages.dev",
	integrations: [
		starlight({
			plugins: [
				starlightBlog({
					title: "Notes",
					postCount: 20,
					recentPostCount: 20,
					authors: {
						maulana: {
							name: "Maulana Shalihin",
							title: "Dulak author",
							url: "https://github.com/maulanashalihin",
						},
					},
				}),
			],
			title: "Dulak",
			description:
				"Deliberately boring full-stack boilerplate: Hono + bun:sqlite + Inertia v3 on Bun, with React/Svelte/Vue templates (vanilla CSS or Tailwind).",
			favicon: "/favicon.svg",
			logo: {
				src: "./src/assets/logo.svg",
				alt: "Dulak logo",
				replacesTitle: false,
			},
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
						{ label: "Building with AI agents", slug: "getting-started/ai-agents" },
					],
				},
			{ label: "Philosophy", slug: "philosophy" },
			{ label: "Dulak vs. other frameworks", slug: "comparisons" },
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
					items: [
						{ label: "Plain form data upload", slug: "uploads/form-data" },
						{ label: "tus resumable upload", slug: "uploads/tus" },
					],
				},
				{
					label: "Deployment",
					items: [
						{ label: "Configuration", slug: "deployment/configuration" },
						{ label: "Docker", slug: "deployment/docker" },
						{ label: "Linux VPS (no Docker)", slug: "deployment/vps" },
						{ label: "Reverse proxy", slug: "deployment/reverse-proxy" },
					],
				},
				{
					label: "Database",
					items: [
						{ label: "Schema & migrations", slug: "database/schema-migrations" },
						{ label: "Performance", slug: "database/performance" },
						{ label: "Replication & backup", slug: "database/replication" },
					],
				},
				{ label: "Testing", slug: "testing" },
				{
					label: "Extending",
					items: [
						{ label: "Adding a feature", slug: "extending/adding-a-feature" },
					],
				},
				{ label: "Troubleshooting", slug: "troubleshooting" },
				{ label: "Contributing", slug: "contributing" },
			],
		}),
		mdx(),
	],
});
