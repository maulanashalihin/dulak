import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import AuthLayout from "../components/AuthLayout";
import Field, { inputClass } from "../components/Field";

export default function Register({
	googleEnabled,
}: {
	googleEnabled: boolean;
}) {
	const { data, setData, post, processing, errors, clearErrors } = useForm({
		name: "",
		email: "",
		password: "",
	});

	const submit = (e: FormEvent) => {
		e.preventDefault();
		post("/register");
	};

	return (
		<AuthLayout>
			<Head title="Register" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">
				Create your account
			</h1>
			<p className="text-muted mb-5">
				Start building with the boilerplate in seconds.
			</p>

			{googleEnabled ? (
				<>
					<a
						className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-border rounded-lg bg-surface font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline"
						href="/auth/google"
					>
						Register with Google
					</a>
					<div className="flex items-center gap-3 text-muted text-xs my-5">
						<span className="flex-1 h-px bg-border" />
						or
						<span className="flex-1 h-px bg-border" />
					</div>
				</>
			) : null}

			<form onSubmit={submit} noValidate>
				<Field id="name" label="Name" error={errors.name}>
					<input
						id="name"
						type="text"
						name="name"
						autoComplete="name"
						className={inputClass}
						value={data.name}
						onChange={(e) => {
							clearErrors("name");
							setData("name", e.target.value);
						}}
					/>
				</Field>

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
						autoComplete="new-password"
						className={inputClass}
						value={data.password}
						onChange={(e) => {
							clearErrors("password");
							setData("password", e.target.value);
						}}
					/>
					<p className="text-xs text-muted mt-1">At least 8 characters.</p>
				</Field>

				<button
					className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
					type="submit"
					disabled={processing}
				>
					{processing ? "Creating account…" : "Create account"}
				</button>
			</form>

			<p className="mt-5 text-center text-muted text-sm">
				Already have an account? <Link href="/login">Log in</Link>
			</p>
		</AuthLayout>
	);
}
