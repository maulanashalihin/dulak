import { Link } from '@inertiajs/react'
import type { ReactNode } from 'react'

/** Centered card layout for the guest pages (login / register). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="brand auth-brand">
          Elysia <span>Inertia</span>
        </Link>
        {children}
      </div>
    </main>
  )
}
