<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";

defineProps<{ googleEnabled?: boolean }>();

const form = useForm({ name: "", email: "", password: "" });

function submit() {
	form.post("/register");
}
</script>

<template>
	<Head><title>Register</title></Head>

	<AuthLayout>
		<h1>Create your account</h1>
		<p class="auth-sub">Start building with the boilerplate in seconds.</p>

		<template v-if="googleEnabled">
			<a class="btn btn-block btn-google" href="/auth/google">
				Register with Google
			</a>
			<div class="divider">or</div>
		</template>

		<form @submit.prevent="submit" novalidate>
			<Field id="name" label="Name" :error="form.errors.name">
				<input
					id="name"
					type="text"
					name="name"
					autocomplete="name"
					v-model="form.name"
					@change="form.clearErrors('name')"
				/>
			</Field>

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

			<Field id="password" label="Password" :error="form.errors.password">
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

			<button
				class="btn btn-primary btn-block"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Creating account…" : "Create account" }}
			</button>
		</form>

		<p class="auth-alt">
			Already have an account? <Link href="/login">Log in</Link>
		</p>
	</AuthLayout>
</template>
