<script lang="ts">
  import Brand from './Brand.svelte'

  let { children }: { children: import('svelte').Snippet } = $props()
</script>

<main class="auth">
  <div class="auth-card">
    <div class="auth-brand">
      <Brand href="/" />
    </div>
    {@render children()}
  </div>
</main>

<style>
  .auth {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background:
      radial-gradient(
        700px 320px at 50% -10%,
        var(--primary-soft),
        transparent 70%
      ),
      var(--bg);
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 2rem;
  }

  .auth-brand {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  /* The classes below are applied to elements rendered by the guest pages
     (Login, Register, …) passed in as children, so they do not receive this
     component's scoping attribute — target them globally. */
  :global(.auth-sub) {
    color: var(--muted);
    margin-bottom: 1.25rem;
  }

  :global(.auth-alt) {
    margin-top: 1.25rem;
    text-align: center;
    color: var(--muted);
    font-size: 0.9rem;
  }

  :global(.notice) {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
  }

  :global(.notice-success) {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  :global([data-theme='dark'] .notice-success) {
    background: #052e16;
    color: #86efac;
    border-color: #14532d;
  }

  :global(.btn-google) {
    border-color: var(--border);
    background: var(--surface);
    font-weight: 600;
  }

  :global(.btn-google:hover) {
    background: var(--primary-soft);
  }

  :global(.divider) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--muted);
    font-size: 0.8rem;
    margin: 1.25rem 0;
  }

  :global(.divider::before),
  :global(.divider::after) {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  :global(.form-row) {
    display: flex;
    justify-content: flex-end;
    margin: -0.25rem 0 1rem;
  }

  :global(.link-small) {
    font-size: 0.85rem;
  }
</style>
