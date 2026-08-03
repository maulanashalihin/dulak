/**
 * App composition: security → assets → auth/inertia → routes → errors.
 */
import { Elysia, ValidationError } from 'elysia'
import { serveAsset } from './assets'
import { readFlash, resolveUser } from './auth'
import { Inertia, type InertiaAssets, type InertiaContext } from './inertia'
import { VALIDATION_MESSAGES, authRoutes } from './routes/auth.routes'
import { pageRoutes } from './routes/pages.routes'
import { checkOrigin } from './security'

/** Form routes whose schema-level validation maps back to an Inertia page. */
const COMPONENT_BY_PATH: Record<string, string> = {
  '/register': 'Register',
  '/login': 'Login',
}

/**
 * Build an Inertia adapter from an error context. Error handlers run even
 * when no route matched, so we resolve the session ourselves rather than
 * relying on the per-route store population.
 */
function inertiaFromContext(c: unknown, assets: InertiaAssets): Inertia {
  const ctx = c as {
    request: Request
    headers: Record<string, string | undefined>
    set: InertiaContext['set']
    cookie?: Record<string, { value?: unknown } | undefined>
  }
  const raw = ctx.cookie?.session?.value
  const sessionToken = typeof raw === 'string' && raw.length > 0 ? raw : null
  // For unmatched routes Elysia's runtime error context omits `headers`.
  const headers = ctx.headers ?? Object.fromEntries(ctx.request.headers.entries())
  return new Inertia(
    {
      request: ctx.request,
      headers,
      set: ctx.set,
      user: resolveUser(sessionToken),
      flash: readFlash(sessionToken),
      sessionToken,
    },
    assets,
  )
}

export function createApp(assets: InertiaAssets) {
  // Note: Elysia applies hooks in registration order — error/global hooks
  // must be registered before the routes they cover.
  return new Elysia()
    .onBeforeHandle(checkOrigin)
    .onError((c) => {
      const { code, error, request, set } = c

      // Schema validation (TypeBox) → 422 with field errors, Inertia-aware.
      if (code === 'VALIDATION' && error instanceof ValidationError) {
        const pathname = new URL(request.url).pathname
        const component = COMPONENT_BY_PATH[pathname]
        const errors: Record<string, string> = {}
        for (const item of error.all) {
          const field = item.path.replace(/^\//, '')
          if (field && !errors[field]) errors[field] = VALIDATION_MESSAGES[item.path] ?? item.message
        }
        if (!component) {
          set.status = 422
          return JSON.stringify({ errors })
        }
        return inertiaFromContext(c, assets).error(component, errors)
      }

      // 404 → render the NotFound page (SSR for browsers, JSON for XHR).
      if (code === 'NOT_FOUND') {
        return inertiaFromContext(c, assets).render('NotFound', {}, { status: 404 })
      }

      console.error(`[error:${code}]`, error)
      set.status = 500
      return 'Internal Server Error'
    })
    .get('/assets/*', ({ params }) => serveAsset(params['*']))
    .use(authRoutes(assets))
    .use(pageRoutes(assets))
}
