# create-dulak

Scaffold a new [Dulak](https://dulak.pages.dev) project — Hono +
bun:sqlite + Inertia v3 boilerplate with auth, roles, SSR, migrations,
tests, and Docker. Code: [github.com/maulanashalihin/dulak](https://github.com/maulanashalihin/dulak).

## Usage

```sh
bun create dulak my-app
```

Or in the current directory:

```sh
bunx create-dulak .
```

The interactive prompt uses **arrow-key navigation** (↑/↓ to select, Enter to confirm) — just like `npm create vite`:

1. **Select a JavaScript framework** — React 19, Svelte 5, or Vue 3
2. **Select a styling approach** — Vanilla CSS or Tailwind CSS v4

## Templates

| Template          | Stack                              | Branch                    |
| ----------------- | ---------------------------------- | ------------------------- |
| `default`         | React 19 + vanilla CSS             | `main`                    |
| `svelte-vanilla`  | Svelte 5 + scoped `<style>` CSS    | `template/svelte-vanilla` |
| `vue-vanilla`     | Vue 3 + scoped `<style>` CSS       | `template/vue-vanilla`    |
| `react-tailwind`  | React 19 + Tailwind CSS v4         | `template/react-tailwind` |
| `svelte-tailwind` | Svelte 5 + Tailwind CSS v4         | `template/svelte-tailwind`|
| `vue-tailwind`    | Vue 3 + Tailwind CSS v4            | `template/vue-tailwind`   |

Select interactively or via `--template`:

```sh
bun create dulak my-app --template svelte-vanilla
```

## Options

| Flag             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `--help`, `-h`   | Show help                                        |
| `--no-install`   | Skip running `bun install`                       |
| `--template <n>` | Use template directly (skip both prompts)        |

## What it does

1. Prompts for a project name (if not provided).
2. Prompts for a framework (React, Svelte, Vue) — arrow-key selection.
3. Prompts for styling (vanilla CSS, Tailwind) — arrow-key selection.
4. Downloads the selected template branch from GitHub.
5. Strips dev-only files (`create-dulak/`, screenshots, `.env`, etc.).
6. Creates `data/` for SQLite and copies `.env.example` → `.env`.
7. Runs `bun install` (unless `--no-install`).

## License

MIT
