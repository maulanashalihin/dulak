import { Head, Link } from "@inertiajs/react";
import Brand from "../components/Brand";
import { useSession } from "../session";
import "./Home.css";

/**
 * Public landing page — CDN-cacheable.
 *
 * This page is rendered with `{ public: true }` on the server, so the
 * HTML contains no `auth.user` in the Inertia page props. Cloudflare
 * caches the response (s-maxage=300, SWR=600). User identity is fetched
 * client-side via `useSession()` → `GET /api/session` after hydration.
 *
 * SSR renders with `user: null` (guest state). After hydration, the
 * session store updates if the visitor is logged in — no hydration
 * mismatch because both SSR and initial client state are identical.
 */
export default function Home() {
  const { user, loading } = useSession();

  return (
    <main className="home">
      <div className="home-container">
        <Brand href="/" className="home-brand" />
        <Head title="Welcome" />
        <h1>Dulak</h1>
        <p className="home-sub">
          A Bun + Hono + Inertia + React boilerplate with Cloudflare edge caching.
        </p>

        <div className="home-actions">
          {loading ? null : user ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-ghost">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
