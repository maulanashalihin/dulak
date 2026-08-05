<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import Layout from '../components/Layout.svelte'
</script>

<svelte:head><title>Not found</title></svelte:head>

<Layout>
  <h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">404 — page not found</h1>
  <p class="text-muted">The page you are looking for does not exist.</p>
  <p>
    <Link
      href="/dashboard"
      class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline"
    >
      Go to dashboard
    </Link>
  </p>
</Layout>
