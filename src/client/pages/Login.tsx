import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import AuthLayout from "../components/AuthLayout";
import Field, { inputClass } from "../components/Field";

export default function Login({
	googleEnabled,
	notice,
}: {
	googleEnabled: boolean;
	notice?: string | null;
}) {
	const { data, setData, post, processing, errors, clearErrors } = useForm({
		email: "",
		password: "",
	});

	const submit = (e: FormEvent) => {
		e.preventDefault();
		post("/login");
	};

	return (
		<AuthLayout>
			<Head title="Login" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Welcome back</h1>
			<p className="text-muted mb-5">Log in to your account to continue.</p>

			{notice ? (
				<div
					className="px-4 py-3 rounded-lg text-sm mb-5 border border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
					role="status"
				>
					{notice}
				</div>
			) : null}

			{googleEnabled ? (
				<>
					<a
						className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-border rounded-lg bg-surface font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
						href="/auth/google"
					>
						Log in with Google
					</a>
					<div className="flex items-center gap-3 text-muted text-xs my-5">
						<span className="flex-1 h-px bg-border" />
						or
						<span className="flex-1 h-px bg-border" />
					</div>
				</>
			) : null}

			<form onSubmit={submit} noValidate>
				<Field id="email" label="Email" error={errors.email}>
					<input
						id="email"
						type="email"
						name="email"
						autoComplete="email"
						className={inputClass}
						value={data.email}
						onChange={(e) => {
							clearErrors("email");
							setData("email", e.target.value);
						}}
					/>
				</Field>

				<Field id="password" label="Password" error={errors.password}>
					<input
						id="password"
						type="password"
						name="password"
						autoComplete="current-password"
						className={inputClass}
						value={data.password}
						onChange={(e) => {
							clearErrors("password");
							setData("password", e.target.value);
						}}
					/>
				</Field>

				<div className="flex justify-end -mt-1 mb-4">
					<Link href="/forgot-password" className="text-sm">
						Forgot your password?
					</Link>
				</div>

				<button
					className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
					type="submit"
					disabled={processing}
				>
					{processing ? "Signing in…" : "Sign in"}
				</button>
			</form>

			<p className="mt-5 text-center text-muted text-sm">
				No account yet? <Link href="/register">Create one</Link>
			</p>
		</AuthLayout>
	);
}
