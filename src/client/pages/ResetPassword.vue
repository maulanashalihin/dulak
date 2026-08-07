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

const inputClass =
	"w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary";

function submit() {
	form.post("/reset-password");
}
</script>

<template>
	<Head><title>Reset password</title></Head>

	<AuthLayout>
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Choose a new password</h1>
		<p class="text-muted mb-5">
			Set a new password for <strong>{{ email }}</strong>.
		</p>

		<form @submit.prevent="submit" novalidate>
			<Field id="password" label="New password" :error="form.errors.password">
				<input
					id="password"
					type="password"
					name="password"
					autocomplete="new-password"
					:class="inputClass"
					v-model="form.password"
					@change="form.clearErrors('password')"
				/>
				<p class="text-xs text-muted mt-1">At least 8 characters.</p>
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
					:class="inputClass"
					v-model="form.passwordConfirmation"
					@change="form.clearErrors('passwordConfirmation')"
				/>
			</Field>

			<p v-if="form.errors.token" class="text-danger text-xs mb-4" role="alert">
				{{ form.errors.token }}
			</p>

			<button
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Saving…" : "Save new password" }}
			</button>
		</form>

		<p class="mt-5 text-center text-muted text-sm">
			<Link href="/login">Back to login</Link>
		</p>
	</AuthLayout>
</template>
