import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { SharedPageProps } from '../../shared/types'

/** App shell: nav, flash banners, page content. */
export default function Layout({ children }: { children: ReactNode }) {
  const { props, flash } = usePage<SharedPageProps>()
  const user = props.auth.user

  return (
    <div className="shell">
      <header className="nav">
        <Link href={user ? '/dashboard' : '/login'} className="brand">
          Elysia <span>Inertia</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <span className="nav-user">{user.name}</span>
              <button className="btn btn-ghost" onClick={() => router.post('/logout')}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {flash.success ? <div className="flash flash-success">{String(flash.success)}</div> : null}
      {flash.error ? <div className="flash flash-error">{String(flash.error)}</div> : null}

      <main className="content">{children}</main>
    </div>
  )
}
