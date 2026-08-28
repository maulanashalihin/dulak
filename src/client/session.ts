/**
 * Client-side session store. Replaces server-injected `auth.user` and
 * `flash` in Inertia page props with a single fetch to `/api/session` on
 * boot. This keeps public page HTML identical for all visitors
 * (cacheable at CDN edge) while still providing user identity to
 * components.
 *
 * Usage in public page components:
 *   import { session } from "../session";
 *   const { user, loading } = $derived($session);
 *
 * The store starts in `loading: true` with `user: null` (guest state).
 * `loadSession()` is called once from `app.ts` on boot. Components
 * re-render when the store updates — no hydration mismatch because SSR
 * also renders with `user: null` (public pages omit auth from props).
 *
 * Auth pages (dashboard, admin, profile) do NOT use this store — they
 * receive `auth.user` directly via Inertia page props.
 */
import { writable } from "svelte/store";
import type { FlashData, User } from "../shared/types";

interface SessionData {
  user: User | null;
  flash: FlashData;
  loading: boolean;
}

const initial: SessionData = { user: null, flash: {}, loading: true };

export const session = writable<SessionData>(initial);

/** Fetch /api/session and update the store. Called once on boot. */
export async function loadSession(): Promise<void> {
  try {
    const res = await fetch("/api/session");
    const data = await res.json();
    session.set({
      user: data.user ?? null,
      flash: data.flash ?? {},
      loading: false,
    });
  } catch {
    session.set({ user: null, flash: {}, loading: false });
  }
}
