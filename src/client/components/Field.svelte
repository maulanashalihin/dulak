<script lang="ts">
  let {
    id,
    label,
    error,
    children,
  }: {
    id: string
    label: string
    error?: unknown
    children: import('svelte').Snippet
  } = $props()
</script>

<div class="mb-4">
  <label for={id} class="block text-sm font-semibold mb-1.5">{label}</label>
  {@render children()}
  {#if error}
    <p class="text-danger text-xs mt-1.5" role="alert">{String(error)}</p>
  {/if}
</div>
