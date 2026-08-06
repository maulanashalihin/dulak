<script lang="ts">
  import { Link } from '@inertiajs/svelte'

  let { href, class: className = '' }: { href: string; class?: string } = $props()
</script>

<Link href={href} class={`brand${className ? ` ${className}` : ''}`}>
  <svg
    class="brand-mark"
    viewBox="0 0 32 32"
    width="28"
    height="28"
    fill="none"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="currentColor" />
    <path d="M17.8 5.6 8.4 18h5.2l-1.2 8.4 9.2-12h-5.2z" fill="white" />
  </svg>
  <span>Dulak</span>
</Link>

<style>
  /* `.brand` is applied to the @inertiajs/svelte <Link> (a component that
     renders <a>), so Svelte's static CSS analyzer cannot see it — keep the
     rule global so it is emitted rather than stripped as "unused". */
  :global(.brand) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  :global(.brand:hover) {
    text-decoration: none;
  }

  .brand-mark {
    color: var(--primary);
    flex-shrink: 0;
  }
</style>
