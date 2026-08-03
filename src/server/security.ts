/**
 * Security middleware (registered on the app instance in app.ts):
 *  - checkOrigin: CSRF defense — SameSite=Lax cookie + Origin check on
 *    unsafe methods (non-browser clients that omit Origin are allowed).
 *  - securityHeaders: hardening headers on every response.
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

/**
 * Note: script-src needs 'unsafe-inline' because Inertia embeds the page
 * payload as an inline <script type="application/json"> (and the progress
 * bar injects inline styles). External script/style injection is still
 * blocked; revisit with nonces if you need a stricter policy.
 */
export function securityHeaders(c: { set: { headers: Record<string, string | number> } }): void {
  const h = c.set.headers
  h['content-security-policy'] =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  h['x-content-type-options'] = 'nosniff'
  h['x-frame-options'] = 'DENY'
  h['referrer-policy'] = 'strict-origin-when-cross-origin'
  h['permissions-policy'] = 'camera=(), microphone=(), geolocation=()'
  h['x-xss-protection'] = '0'
}
