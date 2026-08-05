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
        <p class="sidebar-foot-title">Hono Inertia</p>
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
                <img class="avatar avatar-img" src={user.avatarUrl} alt="" />
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
                    <span class="user-menu-head-email">
                      {user.email}
                    </span>
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
            <Link href="/login" class="btn btn-ghost">
              Log in
            </Link>
            <Link href="/register" class="btn btn-primary">
              Register
            </Link>
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

    <main class="content">{@render children()}</main>

    <footer class="footer">
      <span>Hono Inertia boilerplate</span>
      <span class="footer-stack">
        Bun · Hono · bun:sqlite · Inertia v3
      </span>
    </footer>
  </div>
</div>
