/**
 * Page routes: the Inertia-rendered views.
 */
import { Elysia, t } from 'elysia'
import { guestOnly, requireAuth, requireRole } from '../auth'
import { config } from '../config'
import { countUsers, listUsers, recentUsers, toPublicUser } from '../db'
import { inertiaPlugin, makePopulateStore } from '../inertia-plugin'
import type { InertiaAssets } from '../inertia'
import type { DashboardStats, Paginated, User } from '../../shared/types'

function dashboardStats(): DashboardStats {
  return {
    userCount: countUsers.get()?.n ?? 0,
    recentUsers: recentUsers.all(5).map(toPublicUser),
  }
}

/** One-shot notice shown on the login page after redirects with ?notice=. */
const LOGIN_NOTICES: Record<string, string> = {
  password_reset: 'Your password has been updated. Please sign in.',
  google_failed: 'Google sign-in failed. Please try again or use email.',
}

const pageQuery = t.Object({ notice: t.Optional(t.String()) })
const resetQuery = t.Object({
  email: t.Optional(t.String()),
  token: t.Optional(t.String()),
})
const adminQuery = t.Object({
  page: t.Optional(t.Number()),
  perPage: t.Optional(t.Number()),
})

export const pageRoutes = (assets: InertiaAssets) =>
  new Elysia()
    .use(inertiaPlugin(assets))
    .onBeforeHandle(makePopulateStore(assets))
    .get('/', ({ store }) => store.inertia.redirect(store.user ? '/dashboard' : '/login', 302))
    .get(
      '/login',
      ({ store, query }) =>
        store.inertia.render('Login', {
          googleEnabled: Boolean(config.google.clientId),
          notice: query.notice ? (LOGIN_NOTICES[query.notice] ?? null) : null,
        }),
      { beforeHandle: guestOnly, query: pageQuery },
    )
    .get(
      '/register',
      ({ store }) => store.inertia.render('Register', { googleEnabled: Boolean(config.google.clientId) }),
      { beforeHandle: guestOnly },
    )
    .get('/forgot-password', ({ store }) => store.inertia.render('ForgotPassword'), {
      beforeHandle: guestOnly,
    })
    .get(
      '/reset-password',
      ({ store, query }) =>
        store.inertia.render('ResetPassword', {
          email: query.email ?? '',
          token: query.token ?? '',
        }),
      { beforeHandle: guestOnly, query: resetQuery },
    )
    .get(
      '/dashboard',
      ({ store }) => store.inertia.render('Dashboard', { stats: dashboardStats() }),
      { beforeHandle: requireAuth },
    )
    .get(
      '/admin',
      ({ store, query }) => {
        const page = Math.max(1, Number(query.page ?? 1) || 1)
        const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 10) || 10))
        const total = countUsers.get()?.n ?? 0
        const users: Paginated<User> = {
          data: listUsers.all(perPage, (page - 1) * perPage).map(toPublicUser),
          meta: {
            currentPage: page,
            perPage,
            lastPage: Math.max(1, Math.ceil(total / perPage)),
            total,
          },
        }
        return store.inertia.render('Admin', { users })
      },
      { beforeHandle: requireRole('admin'), query: adminQuery },
    )
