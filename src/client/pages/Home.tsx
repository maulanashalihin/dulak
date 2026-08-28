import { Head, Link } from "@inertiajs/react";
import Brand from "../components/Brand";
import { useSession } from "../session";

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
    <main className="min-h-screen flex items-center justify-center bg-bg p-8">
      <div className="text-center max-w-md mx-auto">
        <Brand href="/" className="justify-center mb-8 text-xl text-primary" />
        <Head title="Welcome" />
        <h1 className="text-[2.5rem] mb-2">Dulak</h1>
        <p className="text-muted mb-8">
          A Bun + Hono + Inertia + React boilerplate with Cloudflare edge caching.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
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
