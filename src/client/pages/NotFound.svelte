<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import Layout from '../components/Layout.svelte'
</script>

<svelte:head><title>Not found</title></svelte:head>

<Layout>
  <h1>404 — page not found</h1>
  <p class="page-sub">The page you are looking for does not exist.</p>
  <p>
    <Link href="/dashboard" class="btn btn-primary">Go to dashboard</Link>
  </p>
</Layout>
