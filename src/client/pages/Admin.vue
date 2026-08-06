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
</script>

<template>
	<Head><title>Admin</title></Head>

	<Layout v-if="user && user.role === 'admin'">
		<h1>Admin</h1>
		<p class="page-sub">
			{{ props.users.meta.total }}
			{{ props.users.meta.total === 1 ? "user" : "users" }} total — page
			{{ currentPage }} of {{ lastPage }}.
		</p>

		<section class="panel">
			<div class="table-wrap">
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Role</th>
							<th>Joined</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="u in props.users.data" :key="u.id">
							<td>{{ u.name }}</td>
							<td>{{ u.email }}</td>
							<td>
								<span :class="['badge', `badge-${u.role}`]">{{ u.role }}</span>
							</td>
							<td>{{ formatDate(u.createdAt) }}</td>
						</tr>
						<tr v-if="props.users.data.length === 0">
							<td colspan="4" class="table-empty">No users yet.</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<nav class="pagination" aria-label="Pagination">
			<Link
				v-if="currentPage > 1"
				:href="pageUrl(currentPage - 1)"
				class="btn btn-ghost"
			>
				Previous
			</Link>
			<span
				v-else
				class="btn btn-ghost"
				aria-disabled="true"
			>
				Previous
			</span>
			<span class="pagination-page">
				Page {{ currentPage }} of {{ lastPage }}
			</span>
			<Link
				v-if="currentPage < lastPage"
				:href="pageUrl(currentPage + 1)"
				class="btn btn-ghost"
			>
				Next
			</Link>
			<span
				v-else
				class="btn btn-ghost"
				aria-disabled="true"
			>
				Next
			</span>
		</nav>
	</Layout>
</template>

<style scoped>
.pagination {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-top: 1rem;
}

.pagination-page {
	color: var(--muted);
	font-size: 0.88rem;
}

.pagination .btn[aria-disabled="true"] {
	opacity: 0.35;
	cursor: not-allowed;
	box-shadow: none;
}

.pagination .btn[aria-disabled="true"]:hover {
	background: transparent;
}
</style>
