import { Head, Link, usePage } from "@inertiajs/react";
import Layout from "../components/Layout";
import type { Paginated, User } from "../../shared/types";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function pageUrl(page: number): string {
	return `/admin?page=${page}`;
}

export default function Admin({ users }: { users: Paginated<User> }) {
	const { props } = usePage();
	if (props.auth.user?.role !== "admin") return null;

	const { currentPage, lastPage } = users.meta;

	const btnGhost =
		"inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-lg bg-transparent text-text font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline";

	return (
		<Layout>
			<Head title="Admin" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Admin</h1>
			<p className="text-muted mb-3">
				{users.meta.total} user{users.meta.total === 1 ? "" : "s"} total — page{" "}
				{currentPage} of {lastPage}.
			</p>

			<section className="bg-surface border border-border rounded-radius p-6">
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Name
								</th>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Email
								</th>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Role
								</th>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Joined
								</th>
							</tr>
						</thead>
						<tbody className="[&>tr:last-child>td]:border-b-0">
							{users.data.map((u) => (
								<tr
									key={u.id}
									className="transition-colors hover:bg-primary-soft"
								>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{u.name}
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{u.email}
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										<span
											className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === "admin" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-primary-soft text-primary"}`}
										>
											{u.role}
										</span>
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{formatDate(u.createdAt)}
									</td>
								</tr>
							))}
							{users.data.length === 0 ? (
								<tr>
									<td colSpan={4} className="text-center text-muted p-6">
										No users yet.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</section>

			<nav
				className="flex items-center justify-between gap-4 mt-4"
				aria-label="Pagination"
			>
				{currentPage > 1 ? (
					<Link href={pageUrl(currentPage - 1)} className={btnGhost}>
						Previous
					</Link>
				) : (
					<span
						className={`${btnGhost} opacity-35 cursor-not-allowed`}
						aria-disabled="true"
					>
						Previous
					</span>
				)}
				<span className="text-muted text-sm">
					Page {currentPage} of {lastPage}
				</span>
				{currentPage < lastPage ? (
					<Link href={pageUrl(currentPage + 1)} className={btnGhost}>
						Next
					</Link>
				) : (
					<span
						className={`${btnGhost} opacity-35 cursor-not-allowed`}
						aria-disabled="true"
					>
						Next
					</span>
				)}
			</nav>
		</Layout>
	);
}
