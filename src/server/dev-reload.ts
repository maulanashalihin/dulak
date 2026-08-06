/**
 * Dev-only Server-Sent Events stream for hot reload on `bun --watch` restart.
 *
 * Two triggers drop the connection so the browser reconnects and reloads:
 *  1. `bun --watch` restarts the process on a server-file change (the whole
 *     process dies, killing every SSE connection).
 *  2. The dev client watcher (client-watcher.ts) rebuilds client assets on a
 *     src/client/** change without restarting, then calls reloadBrowsers()
 *     to close the streams explicitly. `bun --watch` does NOT see
 *     .svelte/.vue edits (they are Bun.build entrypoints, not imports of
 *     src/index.ts), so the watcher is what makes client edits hot.
 * This endpoint keeps one SSE connection open per browser tab; the inline
 * client script injected by inertia.ts does a full `location.reload()` on
 * the second `open` (reconnect) — picking up the freshly built assets.
 *
 * Production is untouched: the route is not registered (see app.ts) and no
 * client script is injected (see inertia.ts), so there is zero overhead and
 * no dangling EventSource in prod bundles.
 *
 * The signal is the connection drop + reconnect itself — the server never
 * needs to send a "reload" event. The periodic heartbeat only keeps
 * intermediate proxies from dropping an idle connection (a drop without a
 * restart would cause a false reload, but `bun dev` runs locally with no
 * proxy, so this is purely defensive).
 */
const HEARTBEAT_MS = 15_000;

/**
 * Active SSE controllers — one per connected browser tab. reloadBrowsers()
 * closes them all so each EventSource reconnects; the inline client script
 * injected by inertia.ts does a full `location.reload()` on the second open,
 * picking up freshly built assets without restarting the process.
 */
const active = new Set<ReadableStreamDefaultController<Uint8Array>>();

/** SSE response that stays open until the process exits or the client leaves. */
export function devReloadStream(): Response {
  // `clear` bridges the timer (created in `start`) to the `cancel` hook.
  let clear: (() => void) | undefined;
  let ctrl: ReadableStreamDefaultController<Uint8Array> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      ctrl = controller;
      active.add(controller);
      const enc = new TextEncoder();
      // Short retry so the browser reconnects quickly once the new server is up.
      controller.enqueue(enc.encode("retry: 500\n\n"));
      const timer = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": heartbeat\n\n"));
        } catch {
          // Stream already closed — stop ticking.
          clearInterval(timer);
        }
      }, HEARTBEAT_MS);
      clear = () => clearInterval(timer);
    },
    cancel() {
      // Bun fires cancel when the client disconnects (tab closed / navigated).
      clear?.();
      if (ctrl) active.delete(ctrl);
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

/**
 * Drop every connected browser tab so its EventSource reconnects and the
 * inline reload script fires. Called by the dev client watcher after a
 * successful asset rebuild (no process restart); the same effect happens
 * naturally when `bun --watch` restarts the whole process.
 */
export function reloadBrowsers(): void {
  for (const controller of active) {
    try {
      controller.close();
    } catch {
      // Already closed — ignore.
    }
  }
  active.clear();
}
