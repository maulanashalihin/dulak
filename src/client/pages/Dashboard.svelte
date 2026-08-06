<script lang="ts">
  import { usePage } from '@inertiajs/svelte'
  import Layout from '../components/Layout.svelte'
  import type { DashboardStats } from '../../shared/types'

  let { stats }: { stats: DashboardStats } = $props()

  const page = usePage()
  const user = $derived(page.props.auth.user)

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
</script>

<svelte:head><title>Dashboard</title></svelte:head>

{#if user}
  <Layout>
    <h1>Dashboard</h1>
    <p class="page-sub">
      You are signed in as <strong>{user.email}</strong> — this page is
      server-rendered, database-backed, and hydrated by Inertia v3.
    </p>

    <section class="stats">
      <div class="stat-card">
        <span class="stat-value">{stats.userCount}</span>
        <span class="stat-label">Total users</span>
      </div>
      <div class="stat-card">
        <span class="stat-value badge-value">{user.role}</span>
        <span class="stat-label">Role</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{formatDate(user.createdAt)}</span>
        <span class="stat-label">Member since</span>
      </div>
    </section>

    <section class="panel">
      <h2>Recent users</h2>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {#each stats.recentUsers as u (u.id)}
              <tr>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </Layout>
{/if}

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .badge-value {
    text-transform: capitalize;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.82rem;
    color: var(--muted);
  }
</style>
