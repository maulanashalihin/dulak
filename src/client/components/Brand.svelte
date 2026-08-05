<script lang="ts">
  import { Link } from '@inertiajs/svelte'

  let { href, class: className = '' }: { href: string; class?: string } = $props()
</script>

<Link href={href} class={className ? `brand ${className}` : 'brand'}>
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
  <span>
    Hono <em>Inertia</em>
  </span>
</Link>
