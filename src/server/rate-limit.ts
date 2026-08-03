/**
 * Minimal in-memory fixed-window rate limiter — zero dependencies.
 * Registered as a beforeHandle on the auth routes (hooks are positional in
 * Elysia 1.4, so it must precede the route definitions it protects).
 *
 * Notes:
 *  - Per-process memory; fine for a single instance. For horizontal scaling
 *    swap this for a shared store (Redis) behind the same hook signature.
 *  - Client key: X-Forwarded-For first entry, else the peer IP, else 'local'
 *    (tests / non-socket requests). Trust X-Forwarded-For only behind a
 *    proxy that sets it.
 */
import type { Server } from 'bun'

type BunServer = Server<any>

export interface RateLimitOptions {
  max: number
  windowSeconds: number
}

interface Bucket {
  count: number
  resetAt: number
}

const MAX_BUCKETS = 10_000

function clientKey(request: Request, server: BunServer | null): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  const ip = server?.requestIP(request)?.address
  return ip ?? 'local'
}

export function rateLimit({ max, windowSeconds }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>()

  return (c: {
    request: Request
    server: BunServer | null
    set: { status?: number | string; headers: Record<string, string | number> }
  }): Response | string | undefined => {
    const now = Date.now()
    const key = clientKey(c.request, c.server)

    // Opportunistic pruning so the map cannot grow unbounded.
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(k)
      }
    }

    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
      return
    }

    bucket.count += 1
    if (bucket.count > max) {
      c.set.status = 429
      c.set.headers['retry-after'] = String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)))
      return 'Too many attempts. Please try again later.'
    }
  }
}
