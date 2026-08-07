<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";

const props = defineProps<{ email: string; token: string }>();

const form = useForm({
	email: props.email,
	token: props.token,
	password: "",
	passwordConfirmation: "",
});

function submit() {
	form.post("/reset-password");
}
</script>

<template>
	<Head><title>Reset password</title></Head>

	<AuthLayout>
		<h1>Choose a new password</h1>
		<p class="auth-sub">
			Set a new password for <strong>{{ email }}</strong>.
		</p>

		<form @submit.prevent="submit" novalidate>
			<Field id="password" label="New password" :error="form.errors.password">
				<input
					id="password"
					type="password"
					name="password"
					autocomplete="new-password"
					v-model="form.password"
					@change="form.clearErrors('password')"
				/>
				<p class="field-hint">At least 8 characters.</p>
			</Field>

			<Field
				id="passwordConfirmation"
				label="Confirm password"
				:error="form.errors.passwordConfirmation"
			>
				<input
					id="passwordConfirmation"
					type="password"
					name="passwordConfirmation"
					autocomplete="new-password"
					v-model="form.passwordConfirmation"
					@change="form.clearErrors('passwordConfirmation')"
				/>
			</Field>

			<p v-if="form.errors.token" class="field-error" role="alert">
				{{ form.errors.token }}
			</p>

			<button
				class="btn btn-primary btn-block"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Saving…" : "Save new password" }}
			</button>
		</form>

		<p class="auth-alt">
			<Link href="/login">Back to login</Link>
		</p>
	</AuthLayout>
</template>
