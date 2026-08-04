/**
 * Auth routes: register / login / logout / forgot-password / reset-password.
 * Forms are Inertia-driven; schema validation maps to 422 page payloads
 * (see server/app.ts), these handlers cover business rules.
 * Auth endpoints are rate-limited (brute-force protection).
 */
import { Elysia, t, type Cookie, type Static } from 'elysia'
import { rateLimit } from '../rate-limit'
import {
  clearPasswordResets,
  clearSessionCookie,
  createPasswordReset,
  createSession,
  deleteSessionByToken,
  hashPassword,
  requireAuth,
  setFlash,
  setSessionCookie,
  verifyPassword,
  verifyPasswordReset,
} from '../auth'
import { config } from '../config'
import { createUser, findUserByEmail, updateUserPassword } from '../db'
import { inertiaPlugin, makePopulateStore, type InertiaStore } from '../inertia-plugin'
import { sendMail } from '../mailer'
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

const forgotPasswordBody = t.Object({
  email: t.String({ format: 'email' }),
})

const resetPasswordBody = t.Object({
  email: t.String({ format: 'email' }),
  token: t.String({ minLength: 1 }),
  password: t.String({ minLength: 8, maxLength: 72 }),
  passwordConfirmation: t.String({ minLength: 1 }),
})

// elysia-rate-limit's `.use()` before the routes breaks Elysia's body-schema
// inference, so handler contexts are typed explicitly from the schemas.
type RegisterBody = Static<typeof registerBody>
type LoginBody = Static<typeof loginBody>
type ForgotPasswordBody = Static<typeof forgotPasswordBody>
type ResetPasswordBody = Static<typeof resetPasswordBody>
type CookieJar = Record<string, Cookie<unknown> | undefined>
type AuthContext<B> = { body: B; store: InertiaStore; cookie: CookieJar }

/**
 * Friendly per-field messages. Elysia 1.4 surfaces TypeBox's raw messages
 * (e.g. "Expected string length greater or equal to 2"), so we map by the
 * failing field path (TypeBox `error:` keyword is ignored in error.all).
 */
export const VALIDATION_MESSAGES: Record<string, string> = {
  '/name': 'Name must be at least 2 characters.',
  '/email': 'Enter a valid email address.',
  '/password': 'Password must be at least 8 characters.',
  '/passwordConfirmation': 'Confirm your password.',
  '/token': 'The reset token is missing.',
}

export const authRoutes = (assets: InertiaAssets) =>
  new Elysia()
    .use(inertiaPlugin(assets))
    .onBeforeHandle(rateLimit({ max: config.rateLimit.authMax, windowSeconds: config.rateLimit.authWindow }))
    .onBeforeHandle(makePopulateStore(assets))
    .post(
      '/register',
      async ({ body, store, cookie }: AuthContext<RegisterBody>) => {
        const page = store.inertia
        if (findUserByEmail.get(body.email)) {
          return page.error('Register', { email: 'That email is already registered.' })
        }
        const passwordHash = await hashPassword(body.password)
        const user = createUser.get(body.name, body.email, passwordHash)
        if (!user) return page.error('Register', { email: 'Could not create your account.' })
        // Rotate the session cookie if one exists (session fixation defense).
        if (store.sessionToken) deleteSessionByToken(store.sessionToken)
        const session = createSession(user.id)
        setSessionCookie(cookie.session, session.token, session.expiresAt)
        return page.redirect('/dashboard')
      },
      { body: registerBody },
    )
    .post(
      '/login',
      async ({ body, store, cookie }: AuthContext<LoginBody>) => {
        const page = store.inertia
        const user = findUserByEmail.get(body.email)
        if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
          return page.error('Login', { email: 'These credentials do not match our records.' })
        }
        // Rotate the session cookie if one exists (session fixation defense).
        if (store.sessionToken) deleteSessionByToken(store.sessionToken)
        const session = createSession(user.id)
        setSessionCookie(cookie.session, session.token, session.expiresAt)
        setFlash(session.token, { success: `Welcome back, ${user.name}!` })
        return page.redirect('/dashboard')
      },
      { body: loginBody },
    )
    .post(
      '/logout',
      ({ store, cookie }: { store: InertiaStore; cookie: CookieJar }) => {
        if (store.sessionToken) deleteSessionByToken(store.sessionToken)
        clearSessionCookie(cookie.session)
        return store.inertia.redirect('/login')
      },
      { beforeHandle: requireAuth },
    )
    .post(
      '/forgot-password',
      async ({ body, store }: { body: ForgotPasswordBody; store: InertiaStore }) => {
        // Always answer the same way (no user enumeration); the reset email
        // is only sent when the account exists.
        const user = findUserByEmail.get(body.email)
        if (user) {
          const token = createPasswordReset(user.email)
          const link = `${config.appUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`
          await sendMail({
            to: user.email,
            subject: 'Reset your password',
            text: `Reset your password:\n${link}\n\nThis link expires in 60 minutes.`,
            html: `<p>We received a request to reset your password.</p><p><a href="${link}">Reset password</a></p><p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
          }).catch((err) => console.error('[mail] failed to send reset email:', err))
        }
        return store.inertia.render('ForgotPassword', { status: 'sent' })
      },
      { body: forgotPasswordBody },
    )
    .post(
      '/reset-password',
      async ({ body, store }: { body: ResetPasswordBody; store: InertiaStore }) => {
        const page = store.inertia
        if (body.password !== body.passwordConfirmation) {
          return page.error('ResetPassword', { password: 'Password confirmation does not match.' })
        }
        const valid = verifyPasswordReset(body.email, body.token)
        const user = valid ? findUserByEmail.get(body.email) : null
        if (!user) {
          return page.error('ResetPassword', { token: 'This reset link is invalid or has expired.' })
        }
        const passwordHash = await hashPassword(body.password)
        updateUserPassword.run(passwordHash, user.id)
        clearPasswordResets(user.email)
        return page.redirect('/login?notice=password_reset')
      },
      { body: resetPasswordBody },
    )
