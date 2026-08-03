/**
 * Types shared between the Elysia server and the Inertia React client.
 * Keep this file free of runtime imports — it must be importable from
 * both `src/server` (Bun runtime) and `src/client` (browser bundle).
 */

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

/** One-shot session flash messages, persisted in the `sessions` table. */
export interface FlashData {
  success?: string
  error?: string
  /** Validation errors for the redirect-back (non-Inertia) flow. */
  errors?: Record<string, string>
}

/** Props the server merges into every Inertia page response. */
export interface SharedPageProps {
  [key: string]: unknown
  auth: { user: User | null }
  errors: Record<string, string>
}

/** Props for the dashboard page. */
export interface DashboardStats {
  userCount: number
  recentUsers: User[]
}
