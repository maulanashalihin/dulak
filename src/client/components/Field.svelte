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

<style>
  .field {
    margin-bottom: 1rem;
  }

  .field label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }

  /* The input is rendered by the parent page (passed as children), so it
     does not receive this component's scoping attribute — target it globally. */
  :global(.field input) {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 0.95rem;
  }

  :global(.field input:focus) {
    outline: 2px solid var(--primary);
    outline-offset: -1px;
    border-color: var(--primary);
  }

  /* Hints and errors are rendered by parent pages (inside or alongside
     Field), so they must be global to match. */
  :global(.field-hint) {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0.3rem 0 0;
  }

  :global(.field-error) {
    font-size: 0.82rem;
    color: var(--danger);
    margin: 0.35rem 0 0;
  }
</style>
