<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import AuthLayout from "../components/AuthLayout.vue";
import Field from "../components/Field.vue";

defineProps<{ googleEnabled?: boolean }>();

const form = useForm({ name: "", email: "", password: "" });

const inputClass =
	"w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary";

function submit() {
	form.post("/register");
}
</script>

<template>
	<Head><title>Register</title></Head>

	<AuthLayout>
		<h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Create your account</h1>
		<p class="text-muted mb-5">Start building with the boilerplate in seconds.</p>

		<template v-if="googleEnabled">
			<a
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-border rounded-lg bg-surface font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
				href="/auth/google"
			>
				Register with Google
			</a>
			<div class="flex items-center gap-3 text-muted text-xs my-5">
				<span class="flex-1 h-px bg-border" />
				or
				<span class="flex-1 h-px bg-border" />
			</div>
		</template>

		<form @submit.prevent="submit" novalidate>
			<Field id="name" label="Name" :error="form.errors.name">
				<input
					id="name"
					type="text"
					name="name"
					autocomplete="name"
					:class="inputClass"
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
					autocomplete="new-password"
					:class="inputClass"
					v-model="form.password"
					@change="form.clearErrors('password')"
				/>
				<p class="text-xs text-muted mt-1">At least 8 characters.</p>
			</Field>

			<button
				class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
				type="submit"
				:disabled="form.processing"
			>
				{{ form.processing ? "Creating account…" : "Create account" }}
			</button>
		</form>

		<p class="mt-5 text-center text-muted text-sm">
			Already have an account? <Link href="/login">Log in</Link>
		</p>
	</AuthLayout>
</template>
