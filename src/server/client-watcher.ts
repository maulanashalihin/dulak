/**
 * Dev-only client-asset watcher. `bun --watch src/index.ts` only watches the
 * import graph of the entry point — and the framework client is NOT in it:
 * src/client/app.ts and src/client/ssr.ts are passed as string `entrypoints`
 * to Bun.build() in assets.ts, never imported by src/index.ts. So editing a
 * client component (.svelte/.vue) does not restart the process and
 * buildClientAssets() never re-runs, leaving the browser on stale assets.
 * (React templates are exempt: ssr.tsx is statically imported by
 * inertia.ts, so .tsx files ARE in the watch graph.)
 *
 * This module watches src/client/** directly and, on a change:
 *  1. debounces, then re-runs buildClientAssets() (client + SSR bundles);
 *  2. hot-swaps the fresh manifest into the live Inertia `assets` object
 *     (mutated in place so every closure that captured it sees the new
 *     version/js/css — no process restart needed);
 *  3. invalidates the cached SSR renderer so the next render re-imports the
 *     freshly built dist/ssr.js (Bun's module cache would otherwise hold the
 *     old module for the life of the process).
 * After rebuild, the browser picks up the new version on the next request
 * (manual refresh; the old SSE auto-reload was removed as too disruptive).
 *
 * Production never imports this module (see src/index.ts), so there is no
 * file watcher and zero overhead in prod.
 */
import { watch } from "node:fs";
import { buildClientAssets, loadManifest } from "./assets";
import { invalidateSsrRenderer, type InertiaAssets } from "./inertia";

const DEBOUNCE_MS = 150;
const CLIENT_DIR = "src/client";

/**
 * Start watching src/client/** for changes. Call once in dev after the
 * initial buildClientAssets() + loadManifest(). Pass the same `assets`
 * object handed to createApp() so rebuilds mutate the live reference.
 */
export function startClientWatcher(assets: InertiaAssets): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let building = false;

  const rebuild = async (): Promise<void> => {
    if (building) return; // coalesce overlapping triggers
    building = true;
    try {
      await buildClientAssets();
      // Hot-swap the manifest in place: every middleware/closure that
      // captured `assets` (inertiaMiddleware, onError, notFound) reads the
      // new version + hashed filenames on the next request.
      Object.assign(assets, loadManifest());
      invalidateSsrRenderer();

      console.log(
        `Client assets rebuilt → version ${assets.version}`,
      );
    } catch (err) {
      // Keep serving the previous assets; the editor will save again.
      console.error("Client asset rebuild failed:", err);
    } finally {
      building = false;
    }
  };

  watch(
    CLIENT_DIR,
    { recursive: true },
    (_event, file) => {
      if (!file) return;
      // Sourcemaps are emitted into src/client by Bun.build? No — outputs go
      // to dist/. This only guards against editor swap files ending in .map.
      if (file.endsWith(".map")) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(rebuild, DEBOUNCE_MS);
    },
  );
}
