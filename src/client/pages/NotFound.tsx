import { Head, Link } from '@inertiajs/react'
import Layout from '../components/Layout'

export default function NotFound() {
  return (
    <Layout>
      <Head title="Not found" />
      <h1>404 — page not found</h1>
      <p className="page-sub">The page you are looking for does not exist.</p>
      <p>
        <Link href="/dashboard" className="btn btn-primary">
          Go to dashboard
        </Link>
      </p>
    </Layout>
  )
}
