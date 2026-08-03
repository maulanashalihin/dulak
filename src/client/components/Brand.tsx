import { Link } from '@inertiajs/react'

/** Brand: inline SVG mark + wordmark, used on the app shell and auth pages. */
export default function Brand({ href, className }: { href: string; className?: string }) {
  return (
    <Link href={href} className={className ? `brand ${className}` : 'brand'}>
      <svg
        className="brand-mark"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="22" height="22" rx="6" fill="currentColor" opacity="0.92" />
        <path d="M13.2 4.2 6.8 13.4h4l-1 6.4 6.4-9.2h-4z" fill="#fff" />
      </svg>
      <span>
        Elysia <em>Inertia</em>
      </span>
    </Link>
  )
}
