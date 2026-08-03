/**
 * Inertia store plugin + per-request session resolution.
 *
 * Elysia 1.4 drops hooks/derive from plugins that carry no routes when
 * `.use()`d, while `state` declarations DO flow. So this plugin only
 * declares the store; `makePopulateStore(assets)` returns the population
 * hook that route-bearing instances register themselves (see routes/*).
 */
import { Elysia } from 'elysia'
import { readFlash, resolveUser } from './auth'
import { Inertia, type InertiaAssets, type InertiaContext } from './inertia'
import { toPublicUser } from './db'
import type { FlashData, User } from '../shared/types'

export interface InertiaStore {
  user: User | null
  flash: FlashData
  sessionToken: string | null
  inertia: Inertia
}

export type InertiaPlugin = ReturnType<typeof inertiaPlugin>

export const inertiaPlugin = (assets: InertiaAssets) =>
  new Elysia({ name: 'inertia-plugin' })
    .state('user', null as User | null)
    .state('flash', {} as FlashData)
    .state('sessionToken', null as string | null)
    .state('inertia', null as unknown as Inertia)

/** Per-request: resolve the session and build the Inertia adapter. */
export function makePopulateStore(assets: InertiaAssets) {
  return (c: {
    store: InertiaStore
    cookie: Record<string, { value?: unknown } | undefined>
    request: Request
    headers: Record<string, string | undefined>
    set: InertiaContext['set']
  }) => {
    const raw = c.cookie.session?.value
    const sessionToken = typeof raw === 'string' && raw.length > 0 ? raw : null
    const row = resolveUser(sessionToken)
    c.store.user = row ? toPublicUser(row) : null
    c.store.flash = readFlash(sessionToken)
    c.store.sessionToken = sessionToken
    c.store.inertia = new Inertia(
      {
        request: c.request,
        headers: c.headers,
        set: c.set,
        user: c.store.user,
        flash: c.store.flash,
        sessionToken,
      },
      assets,
    )
  }
}
