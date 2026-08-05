<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import Layout from "../components/Layout.vue";
</script>

<template>
	<Head><title>Not found</title></Head>

	<Layout>
		<h1>404 — page not found</h1>
		<p class="page-sub">The page you are looking for does not exist.</p>
		<p>
			<Link href="/dashboard" class="btn btn-primary">
				Go to dashboard
			</Link>
		</p>
	</Layout>
</template>
