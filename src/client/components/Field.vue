<script setup lang="ts">
defineProps<{ id: string; label: string; error?: unknown }>();
</script>

<template>
	<div class="mb-4">
		<label :for="id" class="block text-sm font-semibold mb-1.5">{{ label }}</label>
		<slot />
		<p v-if="error" class="text-danger text-xs mt-1.5" role="alert">
			{{ String(error) }}
		</p>
	</div>
</template>
