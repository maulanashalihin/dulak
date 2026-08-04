<script lang="ts">
  import Brand from './Brand.svelte'

  let { children }: { children: import('svelte').Snippet } = $props()
</script>

<main class="auth">
  <div class="auth-card">
    <Brand href="/" class="auth-brand" />
    {@render children()}
  </div>
</main>
