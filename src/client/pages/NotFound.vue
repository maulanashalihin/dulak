<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import Layout from "../components/Layout.vue";
</script>

<template>
	<Head><title>Not found</title></Head>

	<Layout>
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">404 — page not found</h1>
		<p class="text-muted">The page you are looking for does not exist.</p>
		<p>
			<Link
				href="/dashboard"
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline"
			>
				Go to dashboard
			</Link>
		</p>
	</Layout>
</template>
