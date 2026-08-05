/**
 * Type-safe shared props for Inertia v3.
 * Inertia's core types support declaration merging on `InertiaConfig`;
 * `usePage()` then picks up `props.auth.user` automatically.
 */
import '@inertiajs/core'
import type { User } from './types'

declare module '@inertiajs/core' {
  interface InertiaConfig {
    sharedPageProps: {
      auth: { user: User | null }
    }
  }
}
