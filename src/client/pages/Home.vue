<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import Brand from "../components/Brand.vue";
import { session } from "../session";
</script>

<template>
	<Head><title>Welcome</title></Head>

	<main class="min-h-screen flex items-center justify-center bg-bg p-8">
		<div class="text-center max-w-md mx-auto">
			<Brand href="/" class="justify-center mb-8 text-xl text-primary" />
			<h1 class="text-[2.5rem] m-0 mb-2">Dulak</h1>
			<p class="text-muted mb-8">
				A Bun + Hono + Inertia + Vue boilerplate with Cloudflare edge caching.
			</p>

			<div class="flex gap-3 justify-center flex-wrap">
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
