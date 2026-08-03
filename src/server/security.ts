/**
 * Security middleware: CSRF defense for cookie-authenticated state changes.
 *
 * Strategy (defense in depth):
 *  1. Session cookie is SameSite=Lax — browsers never attach it to
 *     cross-site POSTs.
 *  2. For unsafe methods we additionally reject requests whose Origin
 *     (when sent) does not match the request host. Non-browser clients
 *     that omit Origin are allowed through.
 *
 * Registered as a plain app-level beforeHandle in app.ts (Elysia 1.4
 * drops hook-only plugins).
 */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function checkOrigin(c: {
  request: Request
  headers: Record<string, string | undefined>
  set: { status?: number | string }
}): Response | string | undefined {
  if (!UNSAFE_METHODS.has(c.request.method)) return
  const origin = c.headers['origin']
  if (!origin) return
  const originHost = new URL(origin).host
  const requestHost = new URL(c.request.url).host
  if (originHost !== requestHost) {
    c.set.status = 403
    return 'Cross-origin requests are not allowed'
  }
}
