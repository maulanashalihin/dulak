/**
 * Auth routes: register / login / logout.
 * Forms are Inertia-driven; schema validation maps to 422 page payloads
 * (see server/app.ts), these handlers cover business rules.
 */
import { Elysia, t } from 'elysia'
import {
  clearSessionCookie,
  createSession,
  hashPassword,
  requireAuth,
  setFlash,
  setSessionCookie,
  verifyPassword,
} from '../auth'
import { createUser, deleteSession, findUserByEmail } from '../db'
import { inertiaPlugin, makePopulateStore } from '../inertia-plugin'
import type { InertiaAssets } from '../inertia'

const registerBody = t.Object({
  name: t.String({ minLength: 2, maxLength: 80 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8, maxLength: 72 }),
})

const loginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 1 }),
})

/**
 * Friendly per-field messages. Elysia 1.4 surfaces TypeBox's raw messages
 * (e.g. "Expected string length greater or equal to 2"), so we map by the
 * failing field path (TypeBox `error:` keyword is ignored in error.all).
 */
export const VALIDATION_MESSAGES: Record<string, string> = {
  '/name': 'Name must be at least 2 characters.',
  '/email': 'Enter a valid email address.',
  '/password': 'Password must be at least 8 characters.',
}

export const authRoutes = (assets: InertiaAssets) =>
  new Elysia()
    .use(inertiaPlugin(assets))
    .onBeforeHandle(makePopulateStore(assets))
    .post(
      '/register',
      async ({ body, store, cookie }) => {
        const page = store.inertia
        if (findUserByEmail.get(body.email)) {
          return page.error('Register', { email: 'That email is already registered.' })
        }
        const passwordHash = await hashPassword(body.password)
        const user = createUser.get(body.name, body.email, passwordHash)
        if (!user) return page.error('Register', { email: 'Could not create your account.' })
        const session = createSession(user.id)
        setSessionCookie(cookie.session, session.token, session.expiresAt)
        return page.redirect('/dashboard')
      },
      { body: registerBody },
    )
    .post(
      '/login',
      async ({ body, store, cookie }) => {
        const page = store.inertia
        const user = findUserByEmail.get(body.email)
        if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
          return page.error('Login', { email: 'These credentials do not match our records.' })
        }
        const session = createSession(user.id)
        setSessionCookie(cookie.session, session.token, session.expiresAt)
        setFlash(session.token, { success: `Welcome back, ${user.name}!` })
        return page.redirect('/dashboard')
      },
      { body: loginBody },
    )
    .post(
      '/logout',
      ({ store, cookie }) => {
        if (store.sessionToken) deleteSession.run(store.sessionToken)
        clearSessionCookie(cookie.session)
        return store.inertia.redirect('/login')
      },
      { beforeHandle: requireAuth },
    )
