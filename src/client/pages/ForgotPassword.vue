<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";

defineProps<{ status?: string }>();

const form = useForm({ email: "" });

const inputClass =
	"w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary";

function submit() {
	form.post("/forgot-password");
}
</script>

<template>
	<Head><title>Forgot password</title></Head>

	<AuthLayout>
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Reset your password</h1>
		<p class="text-muted mb-5">Enter your email and we will send you a reset link.</p>

		<div
			v-if="status === 'sent'"
			class="px-4 py-3 rounded-lg text-sm mb-5 border border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
			role="status"
		>
			If that email is registered, a reset link has been sent. Check your inbox.
		</div>

		<form @submit.prevent="submit" novalidate>
			<Field id="email" label="Email" :error="form.errors.email">
				<input
					id="email"
					type="email"
					name="email"
					autocomplete="email"
					:class="inputClass"
					v-model="form.email"
					@change="form.clearErrors('email')"
				/>
			</Field>

			<button
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Sending…" : "Send reset link" }}
			</button>
		</form>

		<p class="mt-5 text-center text-muted text-sm">
			Remembered it? <Link href="/login">Back to login</Link>
		</p>
	</AuthLayout>
</template>
