import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Role, SharedPageProps } from "../../shared/types";
import Brand from "./Brand";

type NavItem = {
	href: string;
	label: string;
	icon: ReactNode;
	roles?: Role[];
	/** Match prefix so `/admin` highlights on `/admin?page=2`. */
	match?: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: (
			<svg
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<rect x="3" y="3" width="7" height="9" rx="1" />
				<rect x="14" y="3" width="7" height="5" rx="1" />
				<rect x="14" y="12" width="7" height="9" rx="1" />
				<rect x="3" y="16" width="7" height="5" rx="1" />
			</svg>
		),
		match: (p) => p === "/dashboard" || p.startsWith("/dashboard"),
	},
	{
		href: "/profile",
		label: "Profile",
		icon: (
			<svg
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
		match: (p) => p === "/profile" || p.startsWith("/profile"),
	},
	{
		href: "/admin",
		label: "Admin",
		roles: ["admin"],
		icon: (
			<svg
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
				<path d="m9 12 2 2 4-4" />
			</svg>
		),
		match: (p) => p === "/admin" || p.startsWith("/admin"),
	},
];

const ICON_BELL = (
	<svg
		viewBox="0 0 24 24"
		width="18"
		height="18"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
		<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
	</svg>
);

const ICON_SEARCH = (
	<svg
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="11" cy="11" r="7" />
		<path d="m21 21-4.3-4.3" />
	</svg>
);

const ICON_SUN = (
	<svg
		viewBox="0 0 24 24"
		width="18"
		height="18"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
	</svg>
);

const ICON_MOON = (
	<svg
		viewBox="0 0 24 24"
		width="18"
		height="18"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
	</svg>
);

const ICON_CHEVRON = (
	<svg
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="m6 9 6 6 6-6" />
	</svg>
);

const ICON_LOGOUT = (
	<svg
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<path d="m16 17 5-5-5-5M21 12H9" />
	</svg>
);

const ICON_MENU = (
	<svg
		viewBox="0 0 24 24"
		width="20"
		height="20"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M3 6h18M3 12h18M3 18h18" />
	</svg>
);

const ICON_CLOSE = (
	<svg
		viewBox="0 0 24 24"
		width="20"
		height="20"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M18 6 6 18M6 6l12 12" />
	</svg>
);

type Theme = "light" | "dark";

/**
 * Read the theme the inline head script already applied to <html data-theme>.
 * Falls back to prefers-color-scheme, then light — mirroring the inline script
 * so the React state stays in sync on first mount without a re-render flash.
 */
function getInitialTheme(): Theme {
	if (typeof document !== "undefined") {
		const attr = document.documentElement.getAttribute("data-theme");
		if (attr === "light" || attr === "dark") return attr;
	}
	if (
		typeof matchMedia !== "undefined" &&
		matchMedia("(prefers-color-scheme: dark)").matches
	) {
		return "dark";
	}
	return "light";
}

function initials(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? "")
			.join("") || "?"
	);
}

/** Professional SaaS dashboard shell: collapsible sidebar, topbar with search,
 *  notifications, theme toggle and a user dropdown; flash banners; content; footer. */
export default function Layout({ children }: { children: ReactNode }) {
	const { props, flash, url } = usePage<SharedPageProps>();
	const user = props.auth.user;

	const [theme, setTheme] = useState<Theme>("light");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	// Skip the apply effect on initial mount — the inline head script
	// (themeBoot) already set data-theme + background-color on <html>.
	const skipApply = useRef(true);

	// Sync React state from <html data-theme> BEFORE paint so the toggle
	// icon matches the active theme immediately. useLayoutEffect runs
	// synchronously after commit, before the browser paints — preventing
	// a flash where the apply effect would briefly set "light" on the DOM.
	useLayoutEffect(() => {
		setTheme(getInitialTheme());
	}, []);

	// Persist + apply theme whenever the toggle changes it. Skipped on
	// initial mount (DOM already correct); only user-initiated toggles apply.
	useEffect(() => {
		if (skipApply.current) {
			skipApply.current = false;
			return;
		}
		const el = document.documentElement;
		el.setAttribute("data-theme", theme);
		el.style.backgroundColor = theme === "dark" ? "#0f1117" : "#f6f7fb";
		try {
			localStorage.setItem("theme", theme);
		} catch {
			/* ignore (private mode / SSR) */
		}
	}, [theme]);

	// Close dropdown on outside click.
	useEffect(() => {
		if (!menuOpen) return;
		const onDown = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node))
				setMenuOpen(false);
		};
		const onKey = (e: KeyboardEvent) =>
			e.key === "Escape" && setMenuOpen(false);
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [menuOpen]);

	// Close mobile sidebar on route change.
	useEffect(() => {
		setSidebarOpen(false);
		setMenuOpen(false);
	}, [url]);

	const currentPath = url?.split("?")[0] ?? "";
	const items = NAV_ITEMS.filter(
		(i) => !i.roles || (user && i.roles.includes(user.role)),
	);

	const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

	const handleLogout = () => {
		setMenuOpen(false);
		router.post("/logout");
	};

	return (
		<div className="grid grid-cols-[260px_1fr] min-h-screen bg-bg max-md:grid-cols-1">
			{/* Mobile backdrop */}
			{sidebarOpen ? (
				<div
					className="fixed inset-0 bg-black/50 z-[25] animate-[fade-in_120ms_ease]"
					aria-hidden="true"
					onClick={() => setSidebarOpen(false)}
				/>
			) : null}

			{/* Sidebar */}
			<aside
				className={`sticky top-0 self-start h-screen flex flex-col bg-surface border-r border-border z-30 max-md:fixed max-md:top-0 max-md:left-0 max-md:w-[280px] max-md:max-w-[85vw] max-md:-translate-x-full max-md:transition-transform max-md:shadow-card${sidebarOpen ? " max-md:translate-x-0" : ""}`}
				aria-label="Primary"
			>
				<div className="flex items-center justify-between gap-2 px-5 border-b border-border h-16 shrink-0">
					<Brand href={user ? "/dashboard" : "/login"} />
					<button
						type="button"
						className="hidden items-center justify-center w-9 h-9 border border-border rounded-lg bg-transparent text-text cursor-pointer max-md:flex"
						aria-label="Close navigation"
						onClick={() => setSidebarOpen(false)}
					>
						{ICON_CLOSE}
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto px-3 py-4">
					<p className="mx-3 my-2 text-xs font-bold uppercase tracking-wider text-muted">
						Menu
					</p>
					<ul className="list-none m-0 p-0 flex flex-col gap-0.5">
						{items.map((item) => {
							const active = item.match
								? item.match(currentPath)
								: currentPath === item.href;
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-text text-sm font-medium transition-colors hover:bg-primary-soft hover:no-underline${active ? " bg-primary-soft text-primary font-semibold" : ""}`}
										aria-current={active ? "page" : undefined}
									>
										<span
											className={`inline-flex shrink-0 ${active ? "text-primary" : "text-muted"}`}
										>
											{item.icon}
										</span>
										<span>{item.label}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				<div className="p-3 border-t border-border">
					<div className="p-3.5 rounded-[10px] bg-bg border border-border">
					<p className="m-0 text-sm font-bold">Dulak</p>
						<p className="mt-0.5 text-xs text-muted">
							Bun · SQLite · Inertia v3
						</p>
					</div>
				</div>
			</aside>

			{/* Main column */}
			<div className="flex flex-col min-w-0">
				<header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-2.5 bg-surface/88 backdrop-saturate-[1.8] backdrop-blur border-b border-border h-16 max-md:px-4">
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<button
							type="button"
							className="hidden items-center justify-center w-10 h-10 border border-border rounded-lg bg-surface text-text cursor-pointer shrink-0 max-md:flex"
							aria-label="Open navigation"
							aria-expanded={sidebarOpen}
							onClick={() => setSidebarOpen((v) => !v)}
						>
							{ICON_MENU}
						</button>
						<label className="relative flex items-center w-full max-w-[360px] h-10 px-2.5 border border-border rounded-lg bg-bg text-muted transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)] max-[960px]:hidden">
							<span className="inline-flex text-muted shrink-0">
								{ICON_SEARCH}
							</span>
							<input
								type="search"
								placeholder="Search…"
								aria-label="Search"
								className="flex-1 min-w-0 border-none outline-none bg-transparent text-text text-sm px-1 placeholder:text-muted"
							/>
							<kbd className="font-mono text-xs px-1 py-0.5 border border-border rounded text-muted bg-surface shrink-0">
								⌘K
							</kbd>
						</label>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<button
							type="button"
							className="relative inline-flex items-center justify-center w-10 h-10 border border-border rounded-lg bg-surface text-text cursor-pointer shrink-0 transition-colors hover:bg-primary-soft hover:no-underline"
							aria-label="Notifications"
						>
							{ICON_BELL}
							<span className="absolute top-2 right-[9px] w-1.5 h-1.5 rounded-full bg-primary border-2 border-surface" />
						</button>

						<button
							type="button"
							className="inline-flex items-center justify-center w-10 h-10 border border-border rounded-lg bg-surface text-text cursor-pointer shrink-0 transition-colors hover:bg-primary-soft hover:no-underline"
							aria-label="Toggle theme"
							onClick={toggleTheme}
						>
							{theme === "dark" ? ICON_SUN : ICON_MOON}
						</button>

						{user ? (
							<div className="relative" ref={menuRef}>
								<button
									type="button"
									className="flex items-center gap-2 h-10 px-2.5 py-1 border border-border rounded-full bg-surface text-text cursor-pointer transition-colors hover:bg-primary-soft max-md:p-1"
									aria-haspopup="menu"
									aria-expanded={menuOpen}
									onClick={() => setMenuOpen((v) => !v)}
								>
									{user.avatarUrl ? (
										<img
											className="w-8 h-8 rounded-full object-cover"
											src={user.avatarUrl}
											alt=""
										/>
									) : (
										<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-bold tracking-tight shrink-0">
											{initials(user.name)}
										</span>
									)}
									<span className="flex flex-col items-start leading-tight max-md:hidden">
										<span className="text-sm font-semibold max-w-[140px] truncate">
											{user.name}
										</span>
										<span className="text-xs text-muted capitalize">
											{user.role}
										</span>
									</span>
									<span className="inline-flex text-muted max-md:hidden">
										{ICON_CHEVRON}
									</span>
								</button>

								{menuOpen ? (
									<div
										className="absolute top-full right-0 mt-2 w-60 bg-surface border border-border rounded-xl shadow-card p-1 z-40 animate-[menu-in_120ms_ease]"
										role="menu"
									>
										<div className="flex items-center gap-1.5 px-2.5 pt-2 pb-2.5">
											{user.avatarUrl ? (
												<img
													className="w-11 h-11 rounded-full object-cover"
													src={user.avatarUrl}
													alt=""
												/>
											) : (
												<span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white text-sm font-bold shrink-0">
													{initials(user.name)}
												</span>
											)}
											<div className="flex flex-col min-w-0">
												<span className="text-sm font-semibold truncate">
													{user.name}
												</span>
												<span className="text-xs text-muted truncate">
													{user.email}
												</span>
											</div>
										</div>
										<div className="h-px bg-border my-1.5" />
										<Link
											href="/dashboard"
											className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg bg-transparent text-text text-sm text-left cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
											role="menuitem"
										>
											Dashboard
										</Link>
										{user.role === "admin" ? (
											<Link
												href="/admin"
												className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg bg-transparent text-text text-sm text-left cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
												role="menuitem"
											>
												Admin console
											</Link>
										) : null}
										<div className="h-px bg-border my-1.5" />
										<button
											type="button"
											className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg bg-transparent text-danger text-sm text-left cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
											role="menuitem"
											onClick={handleLogout}
										>
											<span className="inline-flex text-danger">
												{ICON_LOGOUT}
											</span>
											<span>Log out</span>
										</button>
									</div>
								) : null}
							</div>
						) : (
							<div className="flex items-center gap-2">
								<Link
									href="/login"
									className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-lg bg-transparent text-text font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
								>
									Log in
								</Link>
								<Link
									href="/register"
									className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline"
								>
									Register
								</Link>
							</div>
						)}
					</div>
				</header>

				{flash.success ? (
					<div className="w-full max-w-[1200px] mx-auto mt-4 px-4 py-3 text-sm font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
						{String(flash.success)}
					</div>
				) : null}
				{flash.error ? (
					<div className="w-full max-w-[1200px] mx-auto mt-4 px-4 py-3 text-sm font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
						{String(flash.error)}
					</div>
				) : null}

				<main className="flex-1 w-full max-w-[1200px] mx-auto px-5 py-6 max-md:px-4 max-md:py-5">
					{children}
				</main>

				<footer className="mt-auto px-5 py-3.5 flex items-center justify-between gap-3 text-muted text-xs border-t border-border dark:text-[#b6bdcb] max-md:px-4 max-md:py-3">
				<span>Dulak boilerplate</span>
				<span>Bun · Hono · bun:sqlite · Inertia v3</span>
				</footer>
			</div>
		</div>
	);
}
