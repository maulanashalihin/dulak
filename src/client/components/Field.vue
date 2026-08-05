<script setup lang="ts">
defineProps<{ id: string; label: string; error?: unknown }>();
</script>

<template>
	<div class="field">
		<label :for="id">{{ label }}</label>
		<slot />
		<p v-if="error" class="field-error" role="alert">{{ String(error) }}</p>
	</div>
</template>
