<script setup lang="ts">
import { Head, usePage } from "@inertiajs/vue3";
import { computed } from "vue";
import Layout from "../components/Layout.vue";
import type { DashboardStats } from "../../shared/types";

const props = defineProps<{ stats: DashboardStats }>();

const page = usePage();
const user = computed(() => page.props.auth.user);

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
</script>

<template>
	<Head><title>Dashboard</title></Head>

	<Layout v-if="user">
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Dashboard</h1>
		<p class="text-muted mb-3">
			You are signed in as <strong>{{ user.email }}</strong> — this page is
			server-rendered, database-backed, and hydrated by Inertia v3.
		</p>

		<section
			class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 my-6"
		>
			<div
				class="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1"
			>
				<span class="text-xl font-bold">{{ props.stats.userCount }}</span>
				<span class="text-[0.82rem] text-muted">Total users</span>
			</div>
			<div
				class="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1"
			>
				<span class="text-xl font-bold capitalize">{{ user.role }}</span>
				<span class="text-[0.82rem] text-muted">Role</span>
			</div>
			<div
				class="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1"
			>
				<span class="text-xl font-bold">{{ formatDate(user.createdAt) }}</span>
				<span class="text-[0.82rem] text-muted">Member since</span>
			</div>
		</section>

		<section class="bg-surface border border-border rounded-radius p-6">
			<h2 class="text-[1.1rem] m-0 mb-3">Recent users</h2>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-sm">
					<thead>
						<tr>
							<th
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg"
							>
								Name
							</th>
							<th
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg"
							>
								Email
							</th>
							<th
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg"
							>
								Joined
							</th>
						</tr>
					</thead>
					<tbody class="[&>tr:last-child>td]:border-b-0">
						<tr
							v-for="u in props.stats.recentUsers"
							:key="u.id"
							class="transition-colors hover:bg-primary-soft"
						>
							<td
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap"
							>
								{{ u.name }}
							</td>
							<td
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap"
							>
								{{ u.email }}
							</td>
							<td
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap"
							>
								{{ formatDate(u.createdAt) }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</Layout>
</template>
