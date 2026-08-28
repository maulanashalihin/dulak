/**
 * Client-side session store. Replaces server-injected `auth.user` and
 * `flash` in Inertia page props with a single fetch to `/api/session` on
 * boot. This keeps public page HTML identical for all visitors
 * (cacheable at CDN edge) while still providing user identity to
 * components.
 *
 * Usage in public page components:
 *   import { session } from "../session";
 *   const { user, loading } = storeToRefs(session);
 *
 * The store starts in `loading: true` with `user: null` (guest state).
 * `loadSession()` is called once from `app.ts` on boot. Components
 * re-render when the store updates — no hydration mismatch because SSR
 * also renders with `user: null` (public pages omit auth from props).
 *
 * Auth pages (dashboard, admin, profile) do NOT use this store — they
 * receive `auth.user` directly via Inertia page props.
 */
import { reactive } from "vue";
import type { FlashData, User } from "../shared/types";

interface SessionData {
  user: User | null;
  flash: FlashData;
  loading: boolean;
}

export const session = reactive<SessionData>({
  user: null,
  flash: {},
  loading: true,
});

/** Fetch /api/session and update the store. Called once on boot. */
export async function loadSession(): Promise<void> {
  try {
    const res = await fetch("/api/session");
    const data = await res.json();
    session.user = data.user ?? null;
    session.flash = data.flash ?? {};
    session.loading = false;
  } catch {
    session.user = null;
    session.flash = {};
    session.loading = false;
  }
}
