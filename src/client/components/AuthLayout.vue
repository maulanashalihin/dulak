<script setup lang="ts">
import Brand from "./Brand.vue";
</script>

<template>
	<main class="auth">
		<div class="auth-card">
			<Brand href="/" class="auth-brand" />
			<slot />
		</div>
	</main>
</template>
