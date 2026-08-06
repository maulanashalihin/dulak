import type { ReactNode } from 'react'
import Brand from './Brand'
import './AuthLayout.css'

/** Centered card layout for the guest pages (login / register). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <Brand href="/" className="auth-brand" />
        {children}
      </div>
    </main>
  )
}
