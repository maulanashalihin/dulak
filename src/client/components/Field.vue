<script setup lang="ts">
defineProps<{ id: string; label: string; error?: unknown }>();
</script>

<template>
	<div class="field">
		<label :for="id">{{ label }}</label>
		<slot />
		<p v-if="error" class="field-error" role="alert">
			{{ String(error) }}
		</p>
	</div>
</template>

<style scoped>
.field {
	margin-bottom: 1rem;
}

.field label {
	display: block;
	font-size: 0.85rem;
	font-weight: 600;
	margin-bottom: 0.35rem;
}

.field :deep(input) {
	width: 100%;
	padding: 0.6rem 0.75rem;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: var(--bg);
	color: var(--text);
	font: inherit;
	font-size: 0.95rem;
}

.field :deep(input:focus) {
	outline: 2px solid var(--primary);
	outline-offset: -1px;
	border-color: var(--primary);
}

.field :deep(.field-hint) {
	font-size: 0.8rem;
	color: var(--muted);
	margin: 0.3rem 0 0;
}

.field-error {
	font-size: 0.82rem;
	color: var(--danger);
	margin: 0.35rem 0 0;
}
</style>
