<script setup lang="ts">
import { Head, Link, usePage } from "@inertiajs/vue3";
import { computed } from "vue";
import Layout from "../components/Layout.vue";
import type { Paginated, User } from "../../shared/types";

const props = defineProps<{ users: Paginated<User> }>();

const page = usePage();
const user = computed(() => page.props.auth.user);
const currentPage = computed(() => props.users.meta.currentPage);
const lastPage = computed(() => props.users.meta.lastPage);

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function pageUrl(p: number): string {
	return `/admin?page=${p}`;
}

const btnGhost =
	"inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-lg bg-transparent text-text font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline";
</script>

<template>
	<Head><title>Admin</title></Head>

	<Layout v-if="user && user.role === 'admin'">
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Admin</h1>
		<p class="text-muted mb-3">
			{{ props.users.meta.total }}
			{{ props.users.meta.total === 1 ? "user" : "users" }} total — page
			{{ currentPage }} of {{ lastPage }}.
		</p>

		<section class="bg-surface border border-border rounded-radius p-6">
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
								Role
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
							v-for="u in props.users.data"
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
								<span
									:class="`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-primary-soft text-primary'}`"
								>
									{{ u.role }}
								</span>
							</td>
							<td
								class="text-left px-3 py-2.5 border-b border-border whitespace-nowrap"
							>
								{{ formatDate(u.createdAt) }}
							</td>
						</tr>
						<tr v-if="props.users.data.length === 0">
							<td colspan="4" class="text-center text-muted p-6">
								No users yet.
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<nav
			class="flex items-center justify-between gap-4 mt-4"
			aria-label="Pagination"
		>
			<Link
				v-if="currentPage > 1"
				:href="pageUrl(currentPage - 1)"
				:class="btnGhost"
			>
				Previous
			</Link>
			<span
				v-else
				:class="`${btnGhost} opacity-35 cursor-not-allowed`"
				aria-disabled="true"
			>
				Previous
			</span>
			<span class="text-muted text-sm">
				Page {{ currentPage }} of {{ lastPage }}
			</span>
			<Link
				v-if="currentPage < lastPage"
				:href="pageUrl(currentPage + 1)"
				:class="btnGhost"
			>
				Next
			</Link>
			<span
				v-else
				:class="`${btnGhost} opacity-35 cursor-not-allowed`"
				aria-disabled="true"
			>
				Next
			</span>
		</nav>
	</Layout>
</template>
