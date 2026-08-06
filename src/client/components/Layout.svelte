<script lang="ts">
  import { Link, router, usePage } from '@inertiajs/svelte'
  import type { Snippet } from 'svelte'
  import type { Role, SharedPageProps } from '../../shared/types'
  import Brand from './Brand.svelte'

  let { children }: { children: Snippet } = $props()

  const page = usePage<SharedPageProps>()
  const user = $derived(page.props.auth.user)
  const flash = $derived(page.flash)
  const url = $derived(page.url)

  type NavItem = {
    href: string
    label: string
    roles?: Role[]
    match: (path: string) => boolean
  }

  const NAV_ITEMS: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      match: (p) => p === '/dashboard' || p.startsWith('/dashboard'),
    },
    {
      href: '/profile',
      label: 'Profile',
      match: (p) => p === '/profile' || p.startsWith('/profile'),
    },
    {
      href: '/admin',
      label: 'Admin',
      roles: ['admin'],
      match: (p) => p === '/admin' || p.startsWith('/admin'),
    },
  ]

  type Theme = 'light' | 'dark'

  function getInitialTheme(): Theme {
    if (typeof document !== 'undefined') {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light' || attr === 'dark') return attr
    }
    if (
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark'
    }
    return 'light'
  }

  function initials(name: string): string {
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join('') || '?'
    )
  }

  let theme = $state<Theme>('light')
  let sidebarOpen = $state(false)
  let menuOpen = $state(false)
  let menuRef = $state<HTMLDivElement | null>(null)
  let skipApply = $state(true)

  // Sync state from <html data-theme> before paint.
  $effect(() => {
    theme = getInitialTheme()
  })

  // Persist + apply theme whenever the toggle changes it. Skipped on
  // initial mount (DOM already correct from inline head script).
  $effect(() => {
    if (skipApply) {
      skipApply = false
      return
    }
    const el = document.documentElement
    el.setAttribute('data-theme', theme)
    el.style.backgroundColor = theme === 'dark' ? '#0f1117' : '#f6f7fb'
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ignore (private mode / SSR) */
    }
  })

  // Close dropdown on outside click.
  $effect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef && !menuRef.contains(e.target as Node)) menuOpen = false
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (menuOpen = false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  })

  // Close mobile sidebar on route change.
  $effect(() => {
    url // track url
    sidebarOpen = false
    menuOpen = false
  })

  const currentPath = $derived(url?.split('?')[0] ?? '')
  const items = $derived(
    NAV_ITEMS.filter(
      (i) => !i.roles || (user && i.roles.includes(user.role)),
    ),
  )

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark'
  }

  function handleLogout() {
    menuOpen = false
    router.post('/logout')
  }
</script>

<div class="dash">
  <!-- Mobile backdrop -->
  {#if sidebarOpen}
    <div
      class="dash-backdrop"
      aria-hidden="true"
      onclick={() => (sidebarOpen = false)}
    ></div>
  {/if}

  <!-- Sidebar -->
  <aside
    class={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
    aria-label="Primary"
  >
    <div class="sidebar-head">
      <Brand href={user ? '/dashboard' : '/login'} />
      <button
        type="button"
        class="sidebar-close"
        aria-label="Close navigation"
        onclick={() => (sidebarOpen = false)}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="sidebar-nav">
      <p class="sidebar-section">Menu</p>
      <ul>
        {#each items as item (item.href)}
          {@const active = item.match(currentPath)}
          <li>
            <Link
              href={item.href}
              class={`sidebar-link${active ? ' sidebar-link-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span class="sidebar-link-icon">
                {#if item.href === '/dashboard'}
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                {:else if item.href === '/profile'}
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                {:else if item.href === '/admin'}
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                {/if}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="sidebar-foot">
      <div class="sidebar-foot-card">
        <p class="sidebar-foot-title">Dulak</p>
        <p class="sidebar-foot-sub">Bun · SQLite · Inertia v3</p>
      </div>
    </div>
  </aside>

  <!-- Main column -->
  <div class="dash-main">
    <header class="topbar">
      <div class="topbar-left">
        <button
          type="button"
          class="topbar-toggle"
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
          onclick={() => (sidebarOpen = !sidebarOpen)}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <label class="topbar-search">
          <span class="topbar-search-icon">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input type="search" placeholder="Search…" aria-label="Search" />
          <kbd class="topbar-search-kbd">⌘K</kbd>
        </label>
      </div>

      <div class="topbar-right">
        <button
          type="button"
          class="topbar-icon-btn"
          aria-label="Notifications"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span class="topbar-dot" aria-hidden="true"></span>
        </button>

        <button
          type="button"
          class="topbar-icon-btn"
          aria-label="Toggle theme"
          onclick={toggleTheme}
        >
          {#if theme === 'dark'}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              />
            </svg>
          {:else}
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          {/if}
        </button>

        {#if user}
          <div class="user-menu" bind:this={menuRef}>
            <button
              type="button"
              class="user-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onclick={() => (menuOpen = !menuOpen)}
            >
              {#if user.avatarUrl}
                <img
                  class="avatar avatar-img"
                  src={user.avatarUrl}
                  alt=""
                />
              {:else}
                <span class="avatar" aria-hidden="true">
                  {initials(user.name)}
                </span>
              {/if}
              <span class="user-menu-meta">
                <span class="user-menu-name">{user.name}</span>
                <span class="user-menu-role">{user.role}</span>
              </span>
              <span class="user-menu-chevron">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>

            {#if menuOpen}
              <div class="user-menu-panel" role="menu">
                <div class="user-menu-head">
                  {#if user.avatarUrl}
                    <img
                      class="avatar avatar-lg avatar-img"
                      src={user.avatarUrl}
                      alt=""
                    />
                  {:else}
                    <span class="avatar avatar-lg" aria-hidden="true">
                      {initials(user.name)}
                    </span>
                  {/if}
                  <div class="user-menu-head-meta">
                    <span class="user-menu-head-name">{user.name}</span>
                    <span class="user-menu-head-email">{user.email}</span>
                  </div>
                </div>
                <div class="user-menu-divider"></div>
                <Link
                  href="/dashboard"
                  class="user-menu-item"
                  role="menuitem"
                >
                  Dashboard
                </Link>
                {#if user.role === 'admin'}
                  <Link
                    href="/admin"
                    class="user-menu-item"
                    role="menuitem"
                  >
                    Admin console
                  </Link>
                {/if}
                <div class="user-menu-divider"></div>
                <button
                  type="button"
                  class="user-menu-item user-menu-danger"
                  role="menuitem"
                  onclick={handleLogout}
                >
                  <span class="user-menu-item-icon">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5M21 12H9" />
                    </svg>
                  </span>
                  <span>Log out</span>
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="topbar-auth">
            <Link href="/login" class="btn btn-ghost">Log in</Link>
            <Link href="/register" class="btn btn-primary">Register</Link>
          </div>
        {/if}
      </div>
    </header>

    {#if flash?.success}
      <div class="flash flash-success">{String(flash.success)}</div>
    {/if}
    {#if flash?.error}
      <div class="flash flash-error">{String(flash.error)}</div>
    {/if}

    <main class="content">
      {@render children()}
    </main>

    <footer class="footer">
      <span>Dulak boilerplate</span>
      <span class="footer-stack">Bun · Hono · bun:sqlite · Inertia v3</span>
    </footer>
  </div>
</div>

<style>
  .dash {
    display: grid;
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
    background: var(--bg);
  }

  .dash-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .content {
    flex: 1;
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }

  :global(.page-sub) {
    color: var(--muted);
  }

  .dash .content {
    max-width: 1200px;
    padding: 1.5rem 1.25rem 2.5rem;
  }

  .flash {
    width: 100%;
    max-width: 960px;
    margin: 1rem auto 0;
    padding: 0.75rem 1rem;
    font-size: 0.92rem;
    font-weight: 500;
    border-radius: 8px;
    border: 1px solid transparent;
  }

  .flash-success {
    background: #f0fdf4;
    color: #15803d;
    border-color: #bbf7d0;
  }

  .flash-error {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  :global([data-theme='dark']) .flash-success {
    background: #052e16;
    color: #86efac;
    border-color: #14532d;
  }

  :global([data-theme='dark']) .flash-error {
    background: #450a0a;
    color: #fca5a5;
    border-color: #7f1d1d;
  }

  .dash .flash {
    max-width: 1200px;
    margin: 1rem auto 0;
  }

  .footer {
    margin-top: auto;
    padding: 0.85rem 1.5rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--muted);
    font-size: 0.8rem;
    border-top: 1px solid var(--border);
  }

  .footer-stack {
    opacity: 1;
  }

  :global([data-theme='dark']) .footer {
    color: #b6bdcb;
  }

  .dash .footer {
    padding: 0.85rem 1.25rem;
  }

  /* Sidebar. */

  .sidebar {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-right: 1px solid var(--border);
    z-index: 30;
  }

  .sidebar-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0 1.25rem;
    border-bottom: 1px solid var(--border);
    height: 64px;
    flex-shrink: 0;
  }

  .sidebar-close {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0.75rem;
  }

  .sidebar-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-section {
    margin: 0.5rem 0.75rem 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    color: var(--text);
    font-size: 0.92rem;
    font-weight: 500;
    transition:
      background 120ms ease,
      color 120ms ease;
  }

  .sidebar-link:hover {
    text-decoration: none;
    background: var(--primary-soft);
    color: var(--text);
  }

  .sidebar-link-active {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 600;
  }

  .sidebar-link-icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--muted);
  }

  .sidebar-link-active .sidebar-link-icon {
    color: var(--primary);
  }

  .sidebar-foot {
    padding: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .sidebar-foot-card {
    padding: 0.85rem 0.9rem;
    border-radius: 10px;
    background: var(--bg);
    border: 1px solid var(--border);
  }

  .sidebar-foot-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .sidebar-foot-sub {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Topbar. */

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 1.25rem;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    backdrop-filter: saturate(180%) blur(8px);
    border-bottom: 1px solid var(--border);
    height: 64px;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  .topbar-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    flex-shrink: 0;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .topbar-search {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 360px;
    height: 40px;
    padding: 0 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--muted);
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }

  .topbar-search:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }

  .topbar-search-icon {
    display: inline-flex;
    color: var(--muted);
    flex-shrink: 0;
  }

  .topbar-search input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 0.9rem;
    padding: 0 0.4rem;
  }

  .topbar-search input::placeholder {
    color: var(--muted);
  }

  .topbar-search-kbd {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.7rem;
    padding: 0.1rem 0.35rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
    background: var(--surface);
    flex-shrink: 0;
  }

  .topbar-icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background 120ms ease,
      border-color 120ms ease;
  }

  .topbar-icon-btn:hover {
    background: var(--primary-soft);
    text-decoration: none;
  }

  .topbar-dot {
    position: absolute;
    top: 8px;
    right: 9px;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--primary);
    border: 2px solid var(--surface);
  }

  .topbar-auth {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* User menu. */

  .user-menu {
    position: relative;
  }

  .user-menu-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 40px;
    padding: 0.25rem 0.5rem 0.25rem 0.25rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    font: inherit;
    transition:
      background 120ms ease,
      border-color 120ms ease;
  }

  .user-menu-trigger:hover {
    background: var(--primary-soft);
  }

  .user-menu-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
  }

  .user-menu-name {
    font-size: 0.85rem;
    font-weight: 600;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-menu-role {
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: capitalize;
  }

  .user-menu-chevron {
    display: inline-flex;
    color: var(--muted);
  }

  .user-menu-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 240px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    padding: 0.4rem;
    z-index: 40;
    animation: menu-in 120ms ease;
  }

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .user-menu-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.6rem 0.65rem;
  }

  .user-menu-head-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .user-menu-head-name {
    font-size: 0.88rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-menu-head-email {
    font-size: 0.76rem;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-menu-divider {
    height: 1px;
    background: var(--border);
    margin: 0.35rem 0;
  }

  .user-menu-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.55rem 0.6rem;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 0.88rem;
    text-align: left;
    cursor: pointer;
    transition: background 120ms ease;
  }

  .user-menu-item:hover {
    text-decoration: none;
    background: var(--primary-soft);
  }

  .user-menu-item-icon {
    display: inline-flex;
    color: var(--muted);
  }

  .user-menu-danger {
    color: var(--danger);
  }

  .user-menu-danger .user-menu-item-icon {
    color: var(--danger);
  }

  /* Backdrop for mobile sidebar. */

  .dash-backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
    z-index: 25;
    animation: fade-in 120ms ease;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Responsive. */

  @media (max-width: 960px) {
    .topbar-search {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .dash {
      grid-template-columns: 1fr;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 280px;
      max-width: 85vw;
      transform: translateX(-100%);
      transition: transform 200ms ease;
      box-shadow: var(--shadow);
    }

    .sidebar-open {
      transform: translateX(0);
    }

    .sidebar-close {
      display: inline-flex;
    }

    .topbar-toggle {
      display: inline-flex;
    }

    .user-menu-meta {
      display: none;
    }

    .user-menu-chevron {
      display: none;
    }

    .user-menu-trigger {
      padding: 0.25rem;
    }

    .topbar {
      padding: 0.6rem 1rem;
    }

    .dash .content {
      padding: 1.25rem 1rem 2rem;
    }

    .dash .footer {
      padding: 0.75rem 1rem;
    }
  }
</style>
