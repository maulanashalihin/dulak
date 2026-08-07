<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";

defineProps<{ googleEnabled?: boolean; notice?: string | null }>();

const form = useForm({ email: "", password: "" });

function submit() {
	form.post("/login");
}
</script>

<template>
	<Head><title>Login</title></Head>

	<AuthLayout>
		<h1>Welcome back</h1>
		<p class="auth-sub">Log in to your account to continue.</p>

		<div v-if="notice" class="notice notice-success" role="status">
			{{ notice }}
		</div>

		<template v-if="googleEnabled">
			<a class="btn btn-block btn-google" href="/auth/google">
				Log in with Google
			</a>
			<div class="divider">or</div>
		</template>

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

			<Field id="password" label="Password" :error="form.errors.password">
				<input
					id="password"
					type="password"
					name="password"
					autocomplete="current-password"
					v-model="form.password"
					@change="form.clearErrors('password')"
				/>
			</Field>

			<div class="form-row">
				<Link href="/forgot-password" class="link-small">
					Forgot your password?
				</Link>
			</div>

			<button
				class="btn btn-primary btn-block"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Signing in…" : "Sign in" }}
			</button>
		</form>

		<p class="auth-alt">
			No account yet? <Link href="/register">Create one</Link>
		</p>
	</AuthLayout>
</template>
