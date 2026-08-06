<script lang="ts">
  import { Link, usePage } from '@inertiajs/svelte'
  import Layout from '../components/Layout.svelte'
  import type { Paginated, User } from '../../shared/types'

  let { users }: { users: Paginated<User> } = $props()

  const page = usePage()
  const user = $derived(page.props.auth.user)

  const { currentPage, lastPage } = $derived(users.meta)

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function pageUrl(p: number): string {
    return `/admin?page=${p}`
  }
</script>

<svelte:head><title>Admin</title></svelte:head>

{#if user && user.role === 'admin'}
  <Layout>
    <h1>Admin</h1>
    <p class="page-sub">
      {users.meta.total} user{users.meta.total === 1 ? '' : 's'} total — page
      {currentPage} of {lastPage}.
    </p>

    <section class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {#each users.data as u (u.id)}
              <tr>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span class={`badge badge-${u.role}`}>{u.role}</span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
              </tr>
            {/each}
            {#if users.data.length === 0}
              <tr>
                <td colspan={4} class="table-empty">No users yet.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </section>

    <nav class="pagination" aria-label="Pagination">
      {#if currentPage > 1}
        <Link href={pageUrl(currentPage - 1)} class="btn btn-ghost">
          Previous
        </Link>
      {:else}
        <span class="btn btn-ghost" aria-disabled="true">Previous</span>
      {/if}
      <span class="pagination-page">
        Page {currentPage} of {lastPage}
      </span>
      {#if currentPage < lastPage}
        <Link href={pageUrl(currentPage + 1)} class="btn btn-ghost">
          Next
        </Link>
      {:else}
        <span class="btn btn-ghost" aria-disabled="true">Next</span>
      {/if}
    </nav>
  </Layout>
{/if}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
  }

  .pagination-page {
    color: var(--muted);
    font-size: 0.88rem;
  }

  .pagination :global(.btn[aria-disabled='true']) {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }

  .pagination :global(.btn[aria-disabled='true']:hover) {
    background: transparent;
  }
</style>
