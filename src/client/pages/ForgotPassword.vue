<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";

defineProps<{ status?: string }>();

const form = useForm({ email: "" });

function submit() {
	form.post("/forgot-password");
}
</script>

<template>
	<Head><title>Forgot password</title></Head>

	<AuthLayout>
		<h1>Reset your password</h1>
		<p class="auth-sub">Enter your email and we will send you a reset link.</p>

		<div v-if="status === 'sent'" class="notice notice-success" role="status">
			If that email is registered, a reset link has been sent. Check your inbox.
		</div>

		<form @submit.prevent="submit" novalidate>
			<Field id="email" label="Email" :error="form.errors.email">
				<input
					id="email"
					type="email"
					name="email"
					autocomplete="email"
					v-model="form.email"
					@change="form.clearErrors('email')"
				/>
			</Field>

			<button
				class="btn btn-primary btn-block"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Sending…" : "Send reset link" }}
			</button>
		</form>

		<p class="auth-alt">
			Remembered it? <Link href="/login">Back to login</Link>
		</p>
	</AuthLayout>
</template>
