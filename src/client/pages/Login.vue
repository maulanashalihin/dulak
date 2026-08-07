<script setup lang="ts">
import { Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";
import { Head } from "@inertiajs/vue3";

defineProps<{ googleEnabled?: boolean; notice?: string | null }>();

const form = useForm({ email: "", password: "" });

const inputClass =
	"w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary";

function submit() {
	form.post("/login");
}
</script>

<template>
	<Head><title>Login</title></Head>

	<AuthLayout>
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Welcome back</h1>
		<p class="text-muted mb-5">Log in to your account to continue.</p>

		<div
			v-if="notice"
			class="px-4 py-3 rounded-lg text-sm mb-5 border border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
			role="status"
		>
			{{ notice }}
		</div>

		<template v-if="googleEnabled">
			<a
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-border rounded-lg bg-surface font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
				href="/auth/google"
			>
				Log in with Google
			</a>
			<div class="flex items-center gap-3 text-muted text-xs my-5">
				<span class="flex-1 h-px bg-border" />
				or
				<span class="flex-1 h-px bg-border" />
			</div>
		</template>

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

			<Field id="password" label="Password" :error="form.errors.password">
				<input
					id="password"
					type="password"
					name="password"
					autocomplete="current-password"
					:class="inputClass"
					v-model="form.password"
					@change="form.clearErrors('password')"
				/>
			</Field>

			<div class="flex justify-end -mt-1 mb-4">
				<Link href="/forgot-password" class="text-sm">
					Forgot your password?
				</Link>
			</div>

			<button
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Signing in…" : "Sign in" }}
			</button>
		</form>

		<p class="mt-5 text-center text-muted text-sm">
			No account yet? <Link href="/register">Create one</Link>
		</p>
	</AuthLayout>
</template>
