<script setup lang="ts">
import { Link } from "@inertiajs/vue3";

const props = defineProps<{ href: string; class?: string }>();
</script>

<template>
	<Link
		:href="props.href"
		:class="`inline-flex items-center gap-2 font-bold text-text tracking-tight hover:no-underline ${props.class ?? ''}`"
	>
		<svg
			class="text-primary shrink-0"
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
