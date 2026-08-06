/**
 * Dev-only Server-Sent Events stream for hot reload on `bun --watch` restart.
 *
 * `bun dev` (`bun --watch src/index.ts`) watches the import graph of
 * src/index.ts; when a watched file changes the whole process restarts and
 * `buildClientAssets()` re-runs, producing new content-hashed JS/CSS. This
 * endpoint keeps one SSE connection open per browser tab. The restart kills
 * the connection, the browser's EventSource auto-reconnects (retry: 500ms),
 * and the inline client script injected by inertia.ts does a full
 * `location.reload()` on reconnect — picking up the freshly built assets.
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

/** SSE response that stays open until the process exits or the client leaves. */
export function devReloadStream(): Response {
	// `clear` bridges the timer (created in `start`) to the `cancel` hook.
	let clear: (() => void) | undefined;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
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
