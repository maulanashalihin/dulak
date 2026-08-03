import { Head, Link, usePage } from '@inertiajs/react'
import Layout from '../components/Layout'
import type { Paginated, User } from '../../shared/types'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function pageUrl(page: number): string {
  return `/admin?page=${page}`
}

export default function Admin({ users }: { users: Paginated<User> }) {
  const { props } = usePage()
  if (!props.auth.user || props.auth.user.role !== 'admin') return null // guarded server-side

  const { currentPage, lastPage } = users.meta

  return (
    <Layout>
      <Head title="Admin" />
      <h1>Admin</h1>
      <p className="page-sub">
        {users.meta.total} users total — page {currentPage} of {lastPage}.
      </p>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav className="pagination" aria-label="Pagination">
        {currentPage > 1 ? (
          <Link href={pageUrl(currentPage - 1)} className="btn btn-ghost">
            Previous
          </Link>
        ) : (
          <span className="btn btn-ghost" aria-disabled="true">
            Previous
          </span>
        )}
        <span className="pagination-page">
          Page {currentPage} of {lastPage}
        </span>
        {currentPage < lastPage ? (
          <Link href={pageUrl(currentPage + 1)} className="btn btn-ghost">
            Next
          </Link>
        ) : (
          <span className="btn btn-ghost" aria-disabled="true">
            Next
          </span>
        )}
      </nav>
    </Layout>
  )
}
