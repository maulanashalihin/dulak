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

<div class="field">
  <label for={id}>{label}</label>
  {@render children()}
  {#if error}
    <p class="field-error" role="alert">{String(error)}</p>
  {/if}
</div>
