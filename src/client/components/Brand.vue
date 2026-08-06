<script setup lang="ts">
import { Link } from "@inertiajs/vue3";

const props = defineProps<{ href: string; class?: string }>();
</script>

<template>
	<Link :href="props.href" :class="['brand', props.class]">
		<svg
			class="brand-mark"
			viewBox="0 0 32 32"
			width="28"
			height="28"
			fill="none"
			aria-hidden="true"
		>
			<rect width="32" height="32" rx="8" fill="currentColor" />
			<path d="M17.8 5.6 8.4 18h5.2l-1.2 8.4 9.2-12h-5.2z" fill="white" />
		</svg>
		<span>Dulak</span>
	</Link>
</template>

<style scoped>
.brand {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 700;
	font-size: 1.05rem;
	color: var(--text);
	letter-spacing: -0.01em;
}

.brand:hover {
	text-decoration: none;
}

.brand-mark {
	color: var(--primary);
	flex-shrink: 0;
}

.brand em {
	color: var(--primary);
	font-style: normal;
}
</style>
