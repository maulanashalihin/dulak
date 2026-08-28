<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import Brand from '../components/Brand.svelte'
  import { session } from '../session'

  const { user, loading } = $derived($session)
</script>

<svelte:head><title>Welcome</title></svelte:head>

<main class="min-h-screen flex items-center justify-center bg-bg p-8">
  <div class="text-center max-w-md mx-auto">
    <Brand href="/" class="justify-center mb-8 text-xl text-primary" />
    <h1 class="text-[2.5rem] m-0 mb-2">Dulak</h1>
    <p class="text-muted mb-8">
      A Bun + Hono + Inertia + Svelte boilerplate with Cloudflare edge caching.
    </p>

    <div class="flex gap-3 justify-center flex-wrap">
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
