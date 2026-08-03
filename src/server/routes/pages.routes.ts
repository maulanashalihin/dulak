/**
 * Page routes: the Inertia-rendered views.
 */
import { Elysia } from 'elysia'
import { guestOnly, requireAuth } from '../auth'
import { countUsers, recentUsers, toPublicUser } from '../db'
import { inertiaPlugin, makePopulateStore } from '../inertia-plugin'
import type { InertiaAssets } from '../inertia'
import type { DashboardStats } from '../../shared/types'

function dashboardStats(): DashboardStats {
  return {
    userCount: countUsers.get()?.n ?? 0,
    recentUsers: recentUsers.all(5).map(toPublicUser),
  }
}

export const pageRoutes = (assets: InertiaAssets) =>
  new Elysia()
    .use(inertiaPlugin(assets))
    .onBeforeHandle(makePopulateStore(assets))
    .get('/', ({ store }) => store.inertia.redirect(store.user ? '/dashboard' : '/login', 302))
    .get('/login', ({ store }) => store.inertia.render('Login'), { beforeHandle: guestOnly })
    .get('/register', ({ store }) => store.inertia.render('Register'), { beforeHandle: guestOnly })
    .get(
      '/dashboard',
      ({ store }) => store.inertia.render('Dashboard', { stats: dashboardStats() }),
      { beforeHandle: requireAuth },
    )
