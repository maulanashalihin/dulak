/**
 * Auth: argon2id password hashing (Bun.password), DB-backed sessions,
 * httpOnly cookie helpers, flash messages, and route guards.
 */
import { randomBytes } from 'node:crypto'
import type { Cookie } from 'elysia'
import type { FlashData, User } from '../shared/types'
import {
  deleteSession,
  findSession,
  findUserById,
  insertSession,
  updateSessionFlash,
  type UserRow,
} from './db'

export const SESSION_COOKIE = 'session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const isProd = process.env.NODE_ENV === 'production'

// ---------------------------------------------------------------------------
// Passwords (argon2id — OWASP-recommended)
// ---------------------------------------------------------------------------

export const hashPassword = (password: string) =>
  Bun.password.hash(password, { algorithm: 'argon2id', memoryCost: 19456, timeCost: 2 })

export const verifyPassword = (password: string, hash: string) =>
  Bun.password.verify(password, hash)

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface SessionInfo {
  token: string
  expiresAt: Date
}

/** 256-bit random token; it is never logged and only lives in the cookie. */
export function createSession(userId: number): SessionInfo {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  insertSession.run(token, userId, expiresAt.toISOString())
  return { token, expiresAt }
}

export function resolveUser(token: string | null | undefined): UserRow | null {
  if (!token) return null
  const session = findSession.get(token)
  if (!session) return null
  if (Date.now() > new Date(session.expiresAt).getTime()) {
    deleteSession.run(token) // lazy cleanup of expired sessions
    return null
  }
  return findUserById.get(session.userId) ?? null
}

// ---------------------------------------------------------------------------
// Flash messages (one-shot, stored on the session row; consumed on render)
// ---------------------------------------------------------------------------

export function readFlash(token: string | null | undefined): FlashData {
  if (!token) return {}
  const session = findSession.get(token)
  if (!session) return {}
  try {
    const parsed: unknown = JSON.parse(session.flash)
    return parsed && typeof parsed === 'object' ? (parsed as FlashData) : {}
  } catch {
    return {}
  }
}

export function setFlash(token: string, flash: FlashData): void {
  updateSessionFlash.run(JSON.stringify(flash), token)
}

export function clearFlash(token: string | null | undefined): void {
  if (token) updateSessionFlash.run('{}', token)
}

// ---------------------------------------------------------------------------
// Cookies (cookie may be undefined under noUncheckedIndexedAccess)
// ---------------------------------------------------------------------------

export function setSessionCookie(
  cookie: Cookie<unknown> | undefined,
  token: string,
  expiresAt: Date,
): void {
  if (!cookie) return
  cookie.set({
    value: token,
    httpOnly: true,
    sameSite: 'lax', // blocks cross-site POSTs (CSRF baseline, see security.ts)
    secure: isProd,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    expires: expiresAt,
  })
}

export function clearSessionCookie(cookie: Cookie<unknown> | undefined): void {
  cookie?.remove()
}

// ---------------------------------------------------------------------------
// Route guards (return a Response to short-circuit, undefined to continue)
// ---------------------------------------------------------------------------

interface GuardContext {
  store: { user: User | null }
  request: Request
}

const redirectTo = (request: Request, path: string) =>
  Response.redirect(new URL(path, request.url).toString())

export const requireAuth = ({ store, request }: GuardContext): Response | undefined => {
  if (!store.user) return redirectTo(request, '/login')
}

export const guestOnly = ({ store, request }: GuardContext): Response | undefined => {
  if (store.user) return redirectTo(request, '/dashboard')
}
