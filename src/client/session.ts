/**
 * Client-side session store. Replaces server-injected `auth.user` and
 * `flash` in Inertia page props with a single fetch to `/api/session` on
 * boot. This keeps public page HTML identical for all visitors
 * (cacheable at CDN edge) while still providing user identity to
 * components.
 *
 * Usage in public page components:
 *   import { useSession } from "../session";
 *   const { user, loading } = useSession();
 *
 * The store starts in `loading: true` with `user: null` (guest state).
 * `loadSession()` is called once from `app.tsx` on boot. Components
 * re-render when the store updates — no hydration mismatch because SSR
 * also renders with `user: null` (public pages omit auth from props).
 *
 * Auth pages (dashboard, admin, profile) do NOT use this store — they
 * receive `auth.user` directly via Inertia page props.
 */
import { useSyncExternalStore } from "react";
import type { FlashData, User } from "../shared/types";

interface SessionData {
  user: User | null;
  flash: FlashData;
  loading: boolean;
}

const initial: SessionData = { user: null, flash: {}, loading: true };
let state: SessionData = initial;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => { l(); });
}

/** Fetch /api/session and update the store. Called once on boot. */
export async function loadSession(): Promise<void> {
  try {
    const res = await fetch("/api/session");
    const data = await res.json();
    state = {
      user: data.user ?? null,
      flash: data.flash ?? {},
      loading: false,
    };
  } catch {
    state = { user: null, flash: {}, loading: false };
  }
  emit();
}

/** React hook for public page components to access user identity. */
export function useSession(): SessionData {
  return useSyncExternalStore(
    (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => initial, // SSR snapshot — always guest state
  );
}
