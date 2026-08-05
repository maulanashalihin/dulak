# create-dulak

Scaffold a new [Dulak](https://github.com/maulanashalihin/dulak) project —
Elysia + bun:sqlite + Inertia v3 boilerplate with auth, roles, SSR,
migrations, tests, and Docker.

## Usage

```sh
bunx create-dulak my-app
```

Or in the current directory:

```sh
bunx create-dulak .
```

## Templates

| Template         | Stack                              | Branch                    |
| ---------------- | ---------------------------------- | ------------------------- |
| `default`        | React 19 + vanilla CSS             | `main`                    |
| `svelte-tailwind`| Svelte 5 + Tailwind CSS v4         | `template/svelte-tailwind`|
| `react-tailwind` | React 19 + Tailwind CSS v4         | `template/react-tailwind` |

Select interactively or via `--template`:

```sh
bunx create-dulak my-app --template svelte-tailwind
```

## Options

| Flag             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `--help`, `-h`   | Show help                                        |
| `--no-install`   | Skip running `bun install`                       |
| `--template <n>` | Use template directly (skip prompt)              |

## What it does

1. Prompts for a template (or uses `--template`).
2. Downloads the selected template branch from GitHub.
3. Strips dev-only files (`create-dulak/`, screenshots, `.env`, etc.).
4. Creates `data/` for SQLite and copies `.env.example` → `.env`.
5. Runs `bun install` (unless `--no-install`).

## License

MIT
