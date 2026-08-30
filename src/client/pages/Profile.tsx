import { Head, router, useForm, usePage } from "@inertiajs/react";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import Layout from "../components/Layout";
import Field from "../components/Field";
import "./Profile.css";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default function Profile() {
	const { props } = usePage();
	const user = props.auth.user;

	const info = useForm({ name: user?.name ?? "", email: user?.email ?? "" });
	const pass = useForm({
		currentPassword: "",
		password: "",
		passwordConfirmation: "",
	});
	const inputRef = useRef<HTMLInputElement>(null);

	const [selectedName, setSelectedName] = useState<string | null>(null);
	const [phase, setPhase] = useState<"idle" | "uploading" | "done" | "error">(
		"idle",
	);
	const [progress, setProgress] = useState(0);
	const [message, setMessage] = useState<string | null>(null);

	function onFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setSelectedName(file.name);
		setPhase("uploading");
		setMessage(null);
		setProgress(0);
		const fd = new FormData();
		fd.append("avatar", file);
		const xhr = new XMLHttpRequest();
		xhr.upload.onprogress = (ev) => {
			if (ev.lengthComputable)
				setProgress(Math.round((ev.loaded / ev.total) * 100));
		};
		xhr.onload = () => {
			if (xhr.status === 204) {
				setPhase("done");
				router.reload();
			} else {
				setPhase("error");
				setMessage(`Request failed (HTTP ${xhr.status})`);
			}
		};
		xhr.onerror = () => {
			setPhase("error");
			setMessage("Network error");
		};
		xhr.open("POST", "/profile/avatar");
		xhr.send(fd);
	}

	const submitInfo = (e: FormEvent) => {
		e.preventDefault();
		info.patch("/profile");
	};

	const submitPass = (e: FormEvent) => {
		e.preventDefault();
		pass.post("/profile/password");
	};

	if (!user) return null; // guarded server-side by requireAuth

	return (
		<Layout>
			<Head title="Profile" />
			<h1>Profile</h1>
			<p className="page-sub">
				Manage your account — avatar, profile information and password.
			</p>

			<div className="profile-grid">
				<aside className="profile-aside">
					<section className="panel profile-card">
						{user.avatarUrl ? (
							<img
								className="avatar avatar-lg avatar-img"
								src={user.avatarUrl}
								alt=""
							/>
						) : (
							<span className="avatar avatar-lg" aria-hidden="true">
								{user.name
									.split(/\s+/)
									.filter(Boolean)
									.slice(0, 2)
									.map((s) => s[0]?.toUpperCase() ?? "")
									.join("") || "?"}
							</span>
						)}
						<h2 className="profile-name">{user.name}</h2>
						<p className="page-sub">{user.email}</p>
						<div className="profile-meta">
							<span className="badge badge-user">{user.role}</span>
							<span className="profile-since">
								Member since {formatDate(user.createdAt)}
							</span>
						</div>

						<div className="profile-upload">
							<input
								ref={inputRef}
								type="file"
								accept="image/png,image/jpeg,image/gif,image/webp"
								hidden
								onChange={onFile}
							/>
							<button
								type="button"
								className="btn btn-primary"
								disabled={phase === "uploading"}
								onClick={() => inputRef.current?.click()}
							>
								{phase === "uploading" ? "Uploading…" : "Change avatar"}
							</button>
							{selectedName ? (
								<span className="upload-file">{selectedName}</span>
							) : null}
							{message ? <p className="upload-error">{message}</p> : null}
							{phase === "uploading" ? (
								<div
									className="progress"
									role="progressbar"
									aria-valuenow={progress}
									aria-valuemin={0}
									aria-valuemax={100}
								>
									<div
										className="progress-bar"
										style={{ width: `${progress}%` }}
									/>
								</div>
							) : null}
							{phase === "done" ? (
								<p className="upload-done">Avatar updated.</p>
							) : null}
						</div>
					</section>
				</aside>

				<div className="profile-forms">
					<section className="panel">
						<h2>Profile information</h2>
						<form onSubmit={submitInfo} noValidate>
							<Field id="name" label="Name" error={info.errors.name}>
								<input
									id="name"
									type="text"
									name="name"
									autoComplete="name"
									value={info.data.name}
									onChange={(e) => {
										info.clearErrors("name");
										info.setData("name", e.target.value);
									}}
								/>
							</Field>
							<Field id="email" label="Email" error={info.errors.email}>
								<input
									id="email"
									type="email"
									name="email"
									autoComplete="email"
									value={info.data.email}
									onChange={(e) => {
										info.clearErrors("email");
										info.setData("email", e.target.value);
									}}
								/>
							</Field>
							<button
								className="btn btn-primary"
								type="submit"
								disabled={info.processing}
							>
								{info.processing ? "Saving…" : "Save changes"}
							</button>
						</form>
					</section>

					<section className="panel">
						<h2>Change password</h2>
						<form onSubmit={submitPass} noValidate>
							<Field
								id="currentPassword"
								label="Current password"
								error={pass.errors.currentPassword}
							>
								<input
									id="currentPassword"
									type="password"
									name="currentPassword"
									autoComplete="current-password"
									value={pass.data.currentPassword}
									onChange={(e) => {
										pass.clearErrors("currentPassword");
										pass.setData("currentPassword", e.target.value);
									}}
								/>
							</Field>
							<Field
								id="password"
								label="New password"
								error={pass.errors.password}
							>
								<input
									id="password"
									type="password"
									name="password"
									autoComplete="new-password"
									value={pass.data.password}
									onChange={(e) => {
										pass.clearErrors("password");
										pass.setData("password", e.target.value);
									}}
								/>
							</Field>
							<Field
								id="passwordConfirmation"
								label="Confirm new password"
								error={pass.errors.passwordConfirmation}
							>
								<input
									id="passwordConfirmation"
									type="password"
									name="passwordConfirmation"
									autoComplete="new-password"
									value={pass.data.passwordConfirmation}
									onChange={(e) => {
										pass.clearErrors("passwordConfirmation");
										pass.setData("passwordConfirmation", e.target.value);
									}}
								/>
							</Field>
							<button
								className="btn btn-primary"
								type="submit"
								disabled={pass.processing}
							>
								{pass.processing ? "Updating…" : "Update password"}
							</button>
						</form>
					</section>
				</div>
			</div>
		</Layout>
	);
}
