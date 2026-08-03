/**
 * Request logging + correlation id. Registered on the app instance in
 * app.ts (Elysia 1.4 drops hook-only plugins, so these are plain handlers).
 */
import { randomBytes } from 'node:crypto'

export interface LogState {
  requestStart: number
  requestId: string
}

export function logBefore(c: {
  store: LogState
  set: { headers: Record<string, string | number> }
}): void {
  c.store.requestId = randomBytes(6).toString('hex')
  c.store.requestStart = performance.now()
  c.set.headers['x-request-id'] = c.store.requestId
}

export function logAfter(c: { store: LogState; request: Request; set: { status?: number | string } }): void {
  const durationMs = (performance.now() - c.store.requestStart).toFixed(1)
  const { pathname } = new URL(c.request.url)
  // set.status is empty for handler-returned Response objects; default to 200.
  console.log(`[req:${c.store.requestId}] ${c.request.method} ${pathname} -> ${c.set.status ?? 200} (${durationMs}ms)`)
}

export function logError(c: { store: LogState; request: Request; error: unknown }): void {
  const { pathname } = new URL(c.request.url)
  console.error(`[req:${c.store.requestId}] ${c.request.method} ${pathname} FAILED:`, c.error)
}
