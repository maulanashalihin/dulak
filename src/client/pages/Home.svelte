<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import Brand from '../components/Brand.svelte'
  import { session } from '../session'

  const { user, loading } = $derived($session)
</script>

<svelte:head><title>Welcome</title></svelte:head>

<main class="home">
  <div class="home-container">
    <Brand href="/" class="home-brand" />
    <h1>Dulak</h1>
    <p class="home-sub">
      A Bun + Hono + Inertia + Svelte boilerplate with Cloudflare edge caching.
    </p>

    <div class="home-actions">
      {#if loading}
        <!-- wait for session -->
      {:else if user}
        <Link href="/dashboard" class="btn btn-primary">
          Go to Dashboard
        </Link>
      {:else}
        <Link href="/login" class="btn btn-primary">
          Sign in
        </Link>
        <Link href="/register" class="btn btn-ghost">
          Create account
        </Link>
      {/if}
    </div>
  </div>
</main>

<style>
  .home {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    padding: 2rem;
  }

  .home-container {
    text-align: center;
    max-width: 28rem;
  }

  /* `.home-brand` is applied to the <Link> component, so Svelte's static
     CSS analyzer cannot see it — keep the rule global. */
  :global(.home-brand) {
    justify-content: center;
    margin-bottom: 2rem;
    font-size: 1.25rem;
    color: var(--primary);
  }

  .home-container h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .home-sub {
    color: var(--muted);
    margin-bottom: 2rem;
  }

  .home-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
