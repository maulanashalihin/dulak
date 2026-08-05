import { Head, usePage } from "@inertiajs/react";
import Layout from "../components/Layout";
import type { DashboardStats } from "../../shared/types";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default function Dashboard({ stats }: { stats: DashboardStats }) {
	const { props } = usePage();
	const user = props.auth.user;

	if (!user) return null; // guarded server-side by requireAuth

	return (
		<Layout>
			<Head title="Dashboard" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Dashboard</h1>
			<p className="text-muted mb-3">
				You are signed in as <strong>{user.email}</strong> — this page is
				server-rendered, database-backed, and hydrated by Inertia v3.
			</p>

			<section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 my-6">
				<div className="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1">
					<span className="text-xl font-bold">{stats.userCount}</span>
					<span className="text-[0.82rem] text-muted">Total users</span>
				</div>
				<div className="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1">
					<span className="text-xl font-bold capitalize">{user.role}</span>
					<span className="text-[0.82rem] text-muted">Role</span>
				</div>
				<div className="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1">
					<span className="text-xl font-bold">
						{formatDate(user.createdAt)}
					</span>
					<span className="text-[0.82rem] text-muted">Member since</span>
				</div>
			</section>

			<section className="bg-surface border border-border rounded-radius p-6">
				<h2 className="text-[1.1rem] m-0 mb-3">Recent users</h2>
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
									Joined
								</th>
							</tr>
						</thead>
						<tbody className="[&>tr:last-child>td]:border-b-0">
							{stats.recentUsers.map((u) => (
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
										{formatDate(u.createdAt)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</Layout>
	);
}
