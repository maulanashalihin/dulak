import { Link } from "@inertiajs/react";

/** Brand: inline SVG mark + wordmark, used on the app shell and auth pages. */
export default function Brand({
	href,
	className,
}: {
	href: string;
	className?: string;
}) {
	return (
		<Link
			href={href}
			className={`inline-flex items-center gap-2 font-bold text-text tracking-tight hover:no-underline ${className ?? ""}`}
		>
			<svg
				className="text-primary shrink-0"
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
	);
}
