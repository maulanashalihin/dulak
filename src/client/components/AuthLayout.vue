<script setup lang="ts">
import Brand from "./Brand.vue";
</script>

<template>
	<main
		class="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(700px_320px_at_50%_-10%,var(--primary-soft),transparent_70%)] bg-bg"
	>
		<div
			class="w-full max-w-[400px] bg-surface border border-border rounded-radius shadow-card p-8"
		>
			<div class="flex justify-center mb-6">
				<Brand href="/" />
			</div>
			<slot />
		</div>
	</main>
</template>
