#!/usr/bin/env node

import * as clack from "@clack/prompts";
import { downloadTemplate } from "giget";
import { rm, mkdir, copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { execSync } from "node:child_process";
import { argv, exit } from "node:process";

const REPO = "maulanashalihin/dulak";

/**
 * Templates are a 2D matrix: framework × styling.
 * Each combination maps to a git branch in the Dulak repo.
 *
 * Frameworks:  React (default → main), Svelte, Vue
 * Styling:     vanilla CSS (co-located / scoped <style>), Tailwind CSS v4
 */
const FRAMEWORKS = [
	{
		id: "react",
		label: "React 19",
		hint: "default",
		styling: {
			vanilla: { ref: "main", name: "default" },
			tailwind: { ref: "template/react-tailwind", name: "react-tailwind" },
		},
	},
	{
		id: "svelte",
		label: "Svelte 5",
		styling: {
			vanilla: { ref: "template/svelte-vanilla", name: "svelte-vanilla" },
			tailwind: { ref: "template/svelte-tailwind", name: "svelte-tailwind" },
		},
	},
	{
		id: "vue",
		label: "Vue 3",
		styling: {
			vanilla: { ref: "template/vue-vanilla", name: "vue-vanilla" },
			tailwind: { ref: "template/vue-tailwind", name: "vue-tailwind" },
		},
	},
];

const STYLINGS = [
	{
		id: "vanilla",
		label: "Vanilla CSS",
		hint: "co-located, no framework",
	},
	{
		id: "tailwind",
		label: "Tailwind CSS v4",
		hint: "utility classes",
	},
];

/** Flatten the matrix for --template lookup and help text. */
const ALL_TEMPLATES = FRAMEWORKS.flatMap((fw) =>
	Object.entries(fw.styling).map(([styleId, info]) => ({
		name: info.name,
		ref: info.ref,
		label: `${fw.label} + ${STYLINGS.find((s) => s.id === styleId)?.label ?? styleId}`,
	})),
);

/** Files/dirs to strip from the scaffolded project. */
const CLEANUP = [
	".playwright-mcp",
	"create-dulak",
	"site", // the landing/docs site (Astro) — repo-only, not part of a scaffold
	"data",
	"dashboard-light.png",
	".env",
	".github", // CI workflows + dependabot are Dulak-repo-specific, not for scaffolds
];

function help() {
	console.log(`
\x1b[1mcreate-dulak\x1b[0m — scaffold a new Dulak project

\x1b[1mUsage:\x1b[0m
  \x1b[36mbun create dulak\x1b[0m \x1b[2m<project-name>\x1b[0m
  \x1b[36mbunx create-dulak\x1b[0m \x1b[2m<project-name>  (equivalent)\x1b[0m
  \x1b[36mbun create dulak\x1b[0m \x1b[2m.\x1b[0m   \x1b[2m# use current directory\x1b[0m

\x1b[1mOptions:\x1b[0m
  --help, -h          Show this help
  --no-install        Skip running bun install
  --template <name>   Skip prompts, use template directly
                      \x1b[2m${ALL_TEMPLATES.map((t) => t.name).join(" | ")}\x1b[0m

\x1b[1mTemplates:\x1b[0m
  default            React 19 + vanilla CSS
  svelte-vanilla     Svelte 5 + scoped <style> CSS
  vue-vanilla        Vue 3 + scoped <style> CSS
  react-tailwind     React 19 + Tailwind CSS v4
  svelte-tailwind    Svelte 5 + Tailwind CSS v4
  vue-tailwind       Vue 3 + Tailwind CSS v4

\x1b[1mExamples:\x1b[0m
  \x1b[36mbun create dulak\x1b[0m my-app
  \x1b[36mbun create dulak\x1b[0m my-app --template svelte-vanilla
  \x1b[36mbun create dulak\x1b[0m my-app --no-install

\x1b[1mLinks:\x1b[0m
  Docs: https://dulak.pages.dev
  GitHub: https://github.com/maulanashalihin/dulak
`);
}

/** Resolve a --template name to a template object. */
function resolveTemplate(name) {
	return ALL_TEMPLATES.find((t) => t.name === name);
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
	const templateFlag = args.indexOf("--template");
	const templateName = templateFlag !== -1 ? args[templateFlag + 1] : null;

	const positional = args.filter(
		(a) => !a.startsWith("--") && a !== templateName,
	);

	let target = positional[0];

	// --- Interactive mode intro ---
	if (!templateName) {
		clack.intro("create-dulak");
	}

	// Project name prompt (if not provided via CLI).
	if (!target) {
		const nameResponse = await clack.text({
			message: "Project name:",
			placeholder: "my-dulak-app",
			defaultValue: "my-dulak-app",
		});
		if (clack.isCancel(nameResponse)) {
			clack.cancel("Cancelled.");
			exit(1);
		}
		target = nameResponse;
	}

	const isCurrentDir = target === ".";
	const targetDir = resolve(target);

	// Validate target directory.
	if (!isCurrentDir && existsSync(targetDir)) {
		clack.outro(`✗ Directory "${target}" already exists.`);
		exit(1);
	}

	if (isCurrentDir) {
		const entries = await readdir(targetDir);
		const visible = entries.filter((e) => !e.startsWith("."));
		if (visible.length > 0) {
			clack.outro("✗ Current directory is not empty. Use a new directory name.");
			exit(1);
		}
	}

	// Select template: --template bypasses both prompts.
	let template;
	if (templateName) {
		template = resolveTemplate(templateName);
		if (!template) {
			console.error(
				`✗ Unknown template "${templateName}". Available: ${ALL_TEMPLATES.map((t) => t.name).join(", ")}`,
			);
			exit(1);
		}
	} else {
		// Step 1: Framework selection (arrow-key navigation).
		const frameworkChoice = await clack.select({
			message: "Select a JavaScript framework:",
			options: FRAMEWORKS.map((fw) => ({
				value: fw.id,
				label: fw.label,
				hint: fw.hint,
			})),
		});
		if (clack.isCancel(frameworkChoice)) {
			clack.cancel("Cancelled.");
			exit(1);
		}

		const framework = FRAMEWORKS.find((fw) => fw.id === frameworkChoice);

		// Step 2: Styling selection (arrow-key navigation).
		const stylingChoice = await clack.select({
			message: "Select a styling approach:",
			options: STYLINGS.map((s) => ({
				value: s.id,
				label: s.label,
				hint: s.hint,
			})),
		});
		if (clack.isCancel(stylingChoice)) {
			clack.cancel("Cancelled.");
			exit(1);
		}

	template = {
		...framework.styling[stylingChoice],
		label: `${framework.label} + ${STYLINGS.find((s) => s.id === stylingChoice)?.label ?? stylingChoice}`,
	};
	}

// Download template from GitHub.
const ref = template.ref;
const gigetRef = ref === "main" ? `github:${REPO}` : `github:${REPO}#${ref}`;
console.log(`\x1b[36m↓\x1b[0m Downloading Dulak (${template.label})...`);
try {
	await downloadTemplate(gigetRef, {
		dir: targetDir,
		force: true,
	});
} catch (e) {
	console.error(
		`\x1b[31m✗ Failed to download template "${template.name}": ${e.message}\x1b[0m`,
	);
	console.error(
		`\x1b[2m  The branch "${ref}" may not exist yet. Check https://github.com/${REPO}/branches\x1b[0m`,
	);
	exit(1);
}

// Strip files not needed in a fresh project.
console.log("\x1b[36m✓\x1b[0m Cleaning up...");
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

// Rename package.json "name" to the project name (not "dulak").
const pkgPath = join(targetDir, "package.json");
if (existsSync(pkgPath)) {
	const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
	pkg.name = basename(targetDir);
	pkg.version = "0.0.0";
	pkg.private = true;
	delete pkg.repository;
	delete pkg.keywords;
	await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

// Install dependencies.
if (!noInstall) {
	console.log("\x1b[36m↓\x1b[0m Installing dependencies with bun...");
	const ok = runInstall(targetDir);
	if (!ok) {
		console.log('\x1b[33m! bun install failed. Run "bun install" manually.\x1b[0m');
	}
}

// Success message + next steps.
clack.outro(`Dulak project created!  ${template.label}`);

console.log();
console.log("\x1b[1mNext steps:\x1b[0m");
if (!isCurrentDir) {
	console.log(`  \x1b[36mcd\x1b[0m ${target}`);
}
console.log("  \x1b[36mbun\x1b[0m dev");
console.log();
console.log("\x1b[2mDocs: https://dulak.pages.dev\x1b[0m");
console.log("\x1b[2mGitHub: https://github.com/maulanashalihin/dulak\x1b[0m");
}

main().catch((e) => {
	console.error(e.message);
	exit(1);
});
