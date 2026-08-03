import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { SharedPageProps } from '../../shared/types'
import Brand from './Brand'

/** App shell: nav, flash banners, page content, footer. */
export default function Layout({ children }: { children: ReactNode }) {
  const { props, flash } = usePage<SharedPageProps>()
  const user = props.auth.user

  return (
    <div className="shell">
      <header className="nav">
        <Brand href={user ? '/dashboard' : '/login'} />
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
      <footer className="footer">
        <span>Elysia Inertia boilerplate</span>
        <span className="footer-stack">Bun · Elysia · bun:sqlite · Inertia v3</span>
      </footer>
    </div>
  )
}
