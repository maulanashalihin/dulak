<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import Brand from "../components/Brand.vue";
import { session } from "../session";
</script>

<template>
	<Head><title>Welcome</title></Head>

	<main class="home">
		<div class="home-container">
			<Brand href="/" class="home-brand" />
			<h1>Dulak</h1>
			<p class="home-sub">
				A Bun + Hono + Inertia + Vue boilerplate with Cloudflare edge caching.
			</p>

			<div class="home-actions">
				<template v-if="session.loading"><!-- wait for session --></template>
				<Link v-else-if="session.user" href="/dashboard" class="btn btn-primary">
					Go to Dashboard
				</Link>
				<template v-else>
					<Link href="/login" class="btn btn-primary">
						Sign in
					</Link>
					<Link href="/register" class="btn btn-ghost">
						Create account
					</Link>
				</template>
			</div>
		</div>
	</main>
</template>

<style scoped>
.home {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--bg);
	padding: 2rem;
}

.home-container {
	text-align: center;
	max-width: 28rem;
}

.home-brand {
	justify-content: center;
	margin-bottom: 2rem;
	font-size: 1.25rem;
	color: var(--primary);
}

.home-container h1 {
	font-size: 2.5rem;
	margin-bottom: 0.5rem;
}

.home-sub {
	color: var(--muted);
	margin-bottom: 2rem;
}

.home-actions {
	display: flex;
	gap: 0.75rem;
	justify-content: center;
	flex-wrap: wrap;
}
</style>
