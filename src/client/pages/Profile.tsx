import { Head, router, useForm, usePage } from "@inertiajs/react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import Field, { inputClass } from "../components/Field";

const CHUNK_SIZE = 256 * 1024;

/** tus `Upload-Metadata` values are standard base64. */
function toBase64(s: string): string {
	const bytes = new TextEncoder().encode(s);
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin);
}

function statusMessage(res: Response): string {
	return `Request failed (HTTP ${res.status})`;
}

type PendingUpload = { id: string; name: string; size: number };
const PENDING_KEY = "dulak:avatar:upload";

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

	const [pending, setPending] = useState<PendingUpload | null>(null);
	const [phase, setPhase] = useState<"idle" | "uploading" | "done" | "error">(
		"idle",
	);
	const [progress, setProgress] = useState(0);
	const [message, setMessage] = useState<string | null>(null);

	// Pick up an interrupted upload after a refresh (offset is re-read via HEAD).
	useEffect(() => {
		try {
			const raw = localStorage.getItem(PENDING_KEY);
			if (raw) setPending(JSON.parse(raw) as PendingUpload);
		} catch {
			/* ignore */
		}
	}, []);

	useEffect(() => {
		if (pending) localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
		else localStorage.removeItem(PENDING_KEY);
	}, [pending]);

	/** Upload (or resume) `file` against upload id `id` ('' = create a new one). */
	async function runUpload(id: string, file: File) {
		setPhase("uploading");
		setMessage(null);
		setProgress(0);

		let uploadId = id;
		if (!uploadId) {
			const create = await fetch("/uploads", {
				method: "POST",
				headers: {
					"Tus-Resumable": "1.0.0",
					"Upload-Length": String(file.size),
					"Upload-Metadata": `filename ${toBase64(file.name)},filetype ${toBase64(file.type)}`,
				},
			});
			if (!create.ok) {
				setPhase("error");
				setMessage(statusMessage(create));
				return;
			}
			const location = create.headers.get("Location");
			if (!location) {
				setPhase("error");
				setMessage("Server did not return an upload URL");
				return;
			}
			uploadId = location.split("/").pop() ?? "";
			setPending({ id: uploadId, name: file.name, size: file.size });
		}

		// Reconcile the offset with the server so an interrupted upload resumes.
		const head = await fetch(`/uploads/${uploadId}`, {
			method: "HEAD",
			headers: { "Tus-Resumable": "1.0.0" },
		});
		let offset = 0;
		if (head.ok) {
			const h = head.headers.get("Upload-Offset");
			offset = h ? Number(h) || 0 : 0;
		}

		const bytes = new Uint8Array(await file.arrayBuffer());
		while (offset < bytes.byteLength) {
			const end = Math.min(offset + CHUNK_SIZE, bytes.byteLength);
			const res = await fetch(`/uploads/${uploadId}`, {
				method: "PATCH",
				headers: {
					"Tus-Resumable": "1.0.0",
					"Content-Type": "application/offset+octet-stream",
					"Upload-Offset": String(offset),
				},
				body: bytes.slice(offset, end),
			});
			if (!res.ok) {
				setPhase("error");
				setMessage(statusMessage(res));
				return;
			}
			offset = end;
			setProgress(Math.round((offset / bytes.byteLength) * 100));
		}

		const link = await fetch("/profile/avatar", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ uploadId }),
		});
		if (!link.ok) {
			setPhase("error");
			setMessage(statusMessage(link));
			return;
		}
		setPending(null);
		setPhase("done");
		router.reload(); // refresh shared props so the header avatar updates
	}

	function onFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = ""; // allow re-selecting the same file
		if (!file) return;
		// Same file as the interrupted upload? Resume it. Otherwise start fresh.
		if (pending && pending.name === file.name) void runUpload(pending.id, file);
		else void runUpload("", file);
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

	const btnPrimary =
		"inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed";

	return (
		<Layout>
			<Head title="Profile" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Profile</h1>
			<p className="text-muted mb-3">
				Manage your account — avatar, profile information and password.
			</p>

			<div className="grid grid-cols-[300px_1fr] gap-5 items-start max-md:grid-cols-1">
				<aside className="flex flex-col gap-4">
					<section className="bg-surface border border-border rounded-radius p-6 flex flex-col items-center text-center gap-2">
						{user.avatarUrl ? (
							<img
								className="w-11 h-11 rounded-full object-cover"
								src={user.avatarUrl}
								alt=""
							/>
						) : (
							<span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white text-sm font-bold shrink-0">
								{user.name
									.split(/\s+/)
									.filter(Boolean)
									.slice(0, 2)
									.map((s) => s[0]?.toUpperCase() ?? "")
									.join("") || "?"}
							</span>
						)}
						<h2 className="m-0 text-[1.1rem]">{user.name}</h2>
						<p className="text-muted m-0">{user.email}</p>
						<div className="flex items-center justify-center gap-2 flex-wrap">
							<span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-primary-soft text-primary">
								{user.role}
							</span>
							<span className="text-muted text-sm">
								Member since {formatDate(user.createdAt)}
							</span>
						</div>

						<div className="flex flex-col items-center gap-2 w-full mt-3">
							<input
								ref={inputRef}
								type="file"
								accept="image/*"
								hidden
								onChange={onFile}
							/>
							<button
								type="button"
								className={btnPrimary}
								disabled={phase === "uploading"}
								onClick={() => inputRef.current?.click()}
							>
								{phase === "uploading"
									? "Uploading…"
									: pending
										? "Resume upload"
										: "Change avatar"}
							</button>
							{pending ? (
								<span className="text-muted text-sm">
									{pending.name} ({Math.max(1, Math.round(pending.size / 1024))}{" "}
									KB)
								</span>
							) : null}
							{message ? (
								<p className="text-[#b91c1c] text-sm m-0">{message}</p>
							) : null}
							{phase === "uploading" || (pending && phase === "idle") ? (
								<div
									className="mt-4 h-2 rounded-full bg-border overflow-hidden"
									role="progressbar"
									aria-valuenow={progress}
									aria-valuemin={0}
									aria-valuemax={100}
								>
									<div
										className="h-full rounded-full bg-primary transition-[width] duration-[120ms] ease-out"
										style={{ width: `${progress}%` }}
									/>
								</div>
							) : null}
							{phase === "done" ? (
								<p className="text-green-700 font-semibold mt-3 m-0">
									Avatar updated.
								</p>
							) : null}
						</div>
					</section>
				</aside>

				<div className="flex flex-col gap-5">
					<section className="bg-surface border border-border rounded-radius p-6">
						<h2 className="text-[1.1rem] m-0 mb-3">Profile information</h2>
						<form onSubmit={submitInfo} noValidate>
							<Field id="name" label="Name" error={info.errors.name}>
								<input
									id="name"
									type="text"
									name="name"
									autoComplete="name"
									className={inputClass}
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
									className={inputClass}
									value={info.data.email}
									onChange={(e) => {
										info.clearErrors("email");
										info.setData("email", e.target.value);
									}}
								/>
							</Field>
							<button
								className={btnPrimary}
								type="submit"
								disabled={info.processing}
							>
								{info.processing ? "Saving…" : "Save changes"}
							</button>
						</form>
					</section>

					<section className="bg-surface border border-border rounded-radius p-6">
						<h2 className="text-[1.1rem] m-0 mb-3">Change password</h2>
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
									className={inputClass}
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
									className={inputClass}
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
									className={inputClass}
									value={pass.data.passwordConfirmation}
									onChange={(e) => {
										pass.clearErrors("passwordConfirmation");
										pass.setData("passwordConfirmation", e.target.value);
									}}
								/>
							</Field>
							<button
								className={btnPrimary}
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
