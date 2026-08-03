/**
 * Page registry. Explicit imports work identically in the Bun server
 * runtime and the Bun.build client bundle (Bun 1.3 removed
 * `import.meta.glob`). Keys use the `./pages/<Name>.tsx` convention that
 * `resolve()` builds from the Inertia component name.
 */
import type { ComponentType } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'

// Pages receive Inertia page props of varying shapes — widen deliberately.
type PageModule = { default: ComponentType<any> }

export const pages: Record<string, PageModule> = {
  './pages/Dashboard.tsx': { default: Dashboard },
  './pages/Login.tsx': { default: Login },
  './pages/NotFound.tsx': { default: NotFound },
  './pages/Register.tsx': { default: Register },
}

/** Fallback for unknown component names — never resolve to undefined. */
export const notFoundPage = pages['./pages/NotFound.tsx']?.default
