#!/usr/bin/env node

import { downloadTemplate } from "giget";
import { rm, mkdir, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { argv, exit, stdout, stdin } from "node:process";

const REPO = "maulanashalihin/dulak";

/** Templates — each maps to a git branch in the Dulak repo. */
const TEMPLATES = [
	{
		name: "default",
		label: "Default (React 19 + vanilla CSS)",
		ref: "main",
	},
	{
		name: "svelte-tailwind",
		label: "Svelte 5 + Tailwind CSS v4",
		ref: "template/svelte-tailwind",
	},
	{
		name: "react-tailwind",
		label: "React 19 + Tailwind CSS v4",
		ref: "template/react-tailwind",
	},
	{
		name: "vue-tailwind",
		label: "Vue 3 + Tailwind CSS v4",
		ref: "template/vue-tailwind",
	},
];

/** Files/dirs to strip from the scaffolded project. */
const CLEANUP = [
	".playwright-mcp",
	"create-dulak",
	"site", // the landing/docs site (Astro) — repo-only, not part of a scaffold
	"data",
	"dashboard-light.png",
	".env",
];

// --- ANSI helpers (no deps) --------------------------------------------------
const c = {
	reset: (s) => `\x1b[0m${s}\x1b[0m`,
	bold: (s) => `\x1b[1m${s}\x1b[0m`,
	dim: (s) => `\x1b[2m${s}\x1b[0m`,
	green: (s) => `\x1b[32m${s}\x1b[0m`,
	cyan: (s) => `\x1b[36m${s}\x1b[0m`,
	red: (s) => `\x1b[31m${s}\x1b[0m`,
	yellow: (s) => `\x1b[33m${s}\x1b[0m`,
};

function help() {
	console.log(`
${c.bold("create-dulak")} — scaffold a new Dulak project

${c.bold("Usage:")}
  ${c.cyan("bunx create-dulak")} ${c.dim("<project-name>")}
  ${c.cyan("bunx create-dulak")} ${c.dim(".")}   ${c.dim("# use current directory")}

${c.bold("Options:")}
  --help, -h          Show this help
  --no-install        Skip running bun install
  --template <name>   Skip prompt, use template directly
                      ${c.dim("default | svelte-tailwind | react-tailwind | vue-tailwind")}

${c.bold("Templates:")}
  default            React 19 + vanilla CSS
  svelte-tailwind    Svelte 5 + Tailwind CSS v4
  react-tailwind     React 19 + Tailwind CSS v4
  vue-tailwind       Vue 3 + Tailwind CSS v4

${c.bold("Examples:")}
  ${c.cyan("bunx create-dulak")} my-app
  ${c.cyan("bunx create-dulak")} my-app --template svelte-tailwind
  ${c.cyan("bunx create-dulak")} my-app --no-install
`);
}

async function prompt(question) {
	const rl = createInterface({ input: stdin, output: stdout });
	const answer = await rl.question(question);
	rl.close();
	return answer.trim();
}

/** Prompt for template selection with arrow-key navigation. */
async function promptTemplate() {
	console.log(`${c.bold("Select a template:")}`);
	TEMPLATES.forEach((t, i) => {
		console.log(`  ${c.cyan(`${i + 1}.`)} ${t.label}`);
	});
	const answer = await prompt(`${c.cyan("?")} Template number [1]: `);
	const idx = Math.max(0, Math.min(TEMPLATES.length - 1, Number(answer) - 1));
	return TEMPLATES[idx] ?? TEMPLATES[0];
}

function runInstall(targetDir) {
	try {
		execSync("bun install", { cwd: targetDir, stdio: "inherit" });
		return true;
	} catch {
		return false;
	}
}

async function main() {
	const args = argv.slice(2);

	if (args.includes("--help") || args.includes("-h")) {
		help();
		return;
	}

	const noInstall = args.includes("--no-install");
	const templateFlag = args.findIndex((a) => a === "--template");
	const templateName = templateFlag !== -1 ? args[templateFlag + 1] : null;

	const positional = args.filter(
		(a) => !a.startsWith("--") && a !== templateName,
	);

	let target = positional[0];
	if (!target) {
		target = await prompt(`${c.cyan("?")} Project name: `);
	}

	if (!target || target.length === 0) {
		console.error(c.red("✗ Project name is required."));
		exit(1);
	}

	const isCurrentDir = target === ".";
	const targetDir = resolve(target);

	// Validate target directory.
	if (!isCurrentDir && existsSync(targetDir)) {
		console.error(c.red(`✗ Directory "${target}" already exists.`));
		exit(1);
	}

	if (isCurrentDir) {
		const entries = await readdir(targetDir);
		const visible = entries.filter((e) => !e.startsWith("."));
		if (visible.length > 0) {
			console.error(
				c.red("✗ Current directory is not empty. Use a new directory name."),
			);
			exit(1);
		}
	}

	// Select template.
	let template;
	if (templateName) {
		template = TEMPLATES.find((t) => t.name === templateName);
		if (!template) {
			console.error(
				c.red(
					`✗ Unknown template "${templateName}". Available: ${TEMPLATES.map((t) => t.name).join(", ")}`,
				),
			);
			exit(1);
		}
	} else {
		template = await promptTemplate();
	}

	// Download template from GitHub.
	const ref = template.ref;
	const gigetRef = ref === "main" ? `github:${REPO}` : `github:${REPO}#${ref}`;
	console.log(`${c.cyan("↓")} Downloading Dulak (${template.label})...`);
	try {
		await downloadTemplate(gigetRef, {
			dir: targetDir,
			force: true,
		});
	} catch (e) {
		console.error(
			c.red(`✗ Failed to download template "${template.name}": ${e.message}`),
		);
		console.error(
			c.dim(
				`  The branch "${ref}" may not exist yet. Check https://github.com/${REPO}/branches`,
			),
		);
		exit(1);
	}

	// Strip files not needed in a fresh project.
	console.log(`${c.cyan("✓")} Cleaning up...`);
	await Promise.all(
		CLEANUP.map((p) =>
			rm(join(targetDir, p), { recursive: true, force: true }),
		),
	);

	// Create data/ for SQLite DB.
	await mkdir(join(targetDir, "data"), { recursive: true });

	// Copy .env.example → .env.
	const envExample = join(targetDir, ".env.example");
	if (existsSync(envExample)) {
		await copyFile(envExample, join(targetDir, ".env"));
	}

	// Install dependencies.
	if (!noInstall) {
		console.log(`${c.cyan("↓")} Installing dependencies with bun...`);
		const ok = runInstall(targetDir);
		if (!ok) {
			console.log(
				c.yellow('! bun install failed. Run "bun install" manually.'),
			);
		}
	}

	// Success message + next steps.
	console.log();
	console.log(c.green("✓ Dulak project created!"));
	console.log(c.dim(`  Template: ${template.label}`));
	console.log();
	console.log(c.bold("Next steps:"));
	if (!isCurrentDir) {
		console.log(`  ${c.cyan("cd")} ${target}`);
	}
	console.log(`  ${c.cyan("bun")} dev`);
	console.log();
	console.log(c.dim("Docs: https://github.com/maulanashalihin/dulak"));
}

main().catch((e) => {
	console.error(c.red(e.message));
	exit(1);
});
