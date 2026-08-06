import { Head, usePage } from '@inertiajs/react'
import Layout from '../components/Layout'
import type { DashboardStats } from '../../shared/types'
import './Dashboard.css'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Dashboard({ stats }: { stats: DashboardStats }) {
  const { props } = usePage()
  const user = props.auth.user

  if (!user) return null // guarded server-side by requireAuth

  return (
    <Layout>
      <Head title="Dashboard" />
      <h1>Dashboard</h1>
      <p className="page-sub">
        You are signed in as <strong>{user.email}</strong> — this page is server-rendered,
        database-backed, and hydrated by Inertia v3.
      </p>

      <section className="stats">
        <div className="stat-card">
          <span className="stat-value">{stats.userCount}</span>
          <span className="stat-label">Total users</span>
        </div>
        <div className="stat-card">
          <span className="stat-value badge-value">{user.role}</span>
          <span className="stat-label">Role</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatDate(user.createdAt)}</span>
          <span className="stat-label">Member since</span>
        </div>
      </section>

      <section className="panel">
        <h2>Recent users</h2>
        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </Layout>
  )
}
