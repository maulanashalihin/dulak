<script setup lang="ts">
import { Head, router, useForm, usePage } from "@inertiajs/vue3";
import { computed, ref, watch } from "vue";
import Layout from "../components/Layout.vue";
import Field from "../components/Field.vue";

const page = usePage();
const user = computed(() => page.props.auth.user);

const CHUNK_SIZE = 256 * 1024;
const PENDING_KEY = "dulak:avatar:upload";

type PendingUpload = { id: string; name: string; size: number };
type Phase = "idle" | "uploading" | "done" | "error";

// Forms are seeded from the user once (available at setup via initialPage).
const info = ref(
	useForm({
		name: user.value?.name ?? "",
		email: user.value?.email ?? "",
	}),
);
const pass = ref(
	useForm({
		currentPassword: "",
		password: "",
		passwordConfirmation: "",
	}),
);
const inputRef = ref<HTMLInputElement | null>(null);
const pending = ref<PendingUpload | null>(null);
const phase = ref<Phase>("idle");
const progress = ref(0);
const message = ref<string | null>(null);

// Pick up an interrupted upload after a refresh; persist state changes.
try {
	const raw = localStorage.getItem(PENDING_KEY);
	if (raw) pending.value = JSON.parse(raw) as PendingUpload;
} catch {
	/* ignore */
}
watch(pending, (p) => {
	if (p) localStorage.setItem(PENDING_KEY, JSON.stringify(p));
	else localStorage.removeItem(PENDING_KEY);
});

function toBase64(s: string): string {
	const bytes = new TextEncoder().encode(s);
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin);
}

function statusMessage(res: Response): string {
	return `Request failed (HTTP ${res.status})`;
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

/** Upload (or resume) `file` against upload id `id` ('' = create a new one). */
async function runUpload(id: string, file: File) {
	phase.value = "uploading";
	message.value = null;
	progress.value = 0;

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
			phase.value = "error";
			message.value = statusMessage(create);
			return;
		}
		const location = create.headers.get("Location");
		if (!location) {
			phase.value = "error";
			message.value = "Server did not return an upload URL";
			return;
		}
		uploadId = location.split("/").pop() ?? "";
		pending.value = { id: uploadId, name: file.name, size: file.size };
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
			phase.value = "error";
			message.value = statusMessage(res);
			return;
		}
		offset = end;
		progress.value = Math.round((offset / bytes.byteLength) * 100);
	}

	const link = await fetch("/profile/avatar", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ uploadId }),
	});
	if (!link.ok) {
		phase.value = "error";
		message.value = statusMessage(link);
		return;
	}
	pending.value = null;
	phase.value = "done";
	router.reload();
}

function onFile(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	target.value = ""; // allow re-selecting the same file
	if (!file) return;
	if (pending.value && pending.value.name === file.name) {
		void runUpload(pending.value.id, file);
	} else {
		void runUpload("", file);
	}
}

function submitInfo() {
	info.value.patch("/profile");
}

function submitPass() {
	pass.value.post("/profile/password");
}

function initials(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? "")
			.join("") || "?"
	);
}
</script>

<template>
	<Head><title>Profile</title></Head>

	<Layout v-if="user">
		<h1>Profile</h1>
		<p class="page-sub">
			Manage your account — avatar, profile information and password.
		</p>

		<div class="profile-grid">
			<aside class="profile-aside">
				<section class="panel profile-card">
					<img
						v-if="user.avatarUrl"
						class="avatar avatar-lg avatar-img"
						:src="user.avatarUrl"
						alt=""
					/>
					<span v-else class="avatar avatar-lg" aria-hidden="true">
						{{ initials(user.name) }}
					</span>
					<h2 class="profile-name">{{ user.name }}</h2>
					<p class="page-sub">{{ user.email }}</p>
					<div class="profile-meta">
						<span class="badge badge-user">{{ user.role }}</span>
						<span class="profile-since">
							Member since {{ formatDate(user.createdAt) }}
						</span>
					</div>

					<div class="profile-upload">
						<input
							ref="inputRef"
							type="file"
							accept="image/*"
							hidden
							@change="onFile"
						/>
						<button
							type="button"
							class="btn btn-primary"
							:disabled="phase === 'uploading'"
							@click="inputRef?.click()"
						>
							{{
								phase === "uploading"
									? "Uploading…"
									: pending
										? "Resume upload"
										: "Change avatar"
							}}
						</button>
						<span v-if="pending" class="upload-file">
							{{ pending.name }} ({{ Math.max(1, Math.round(pending.size / 1024)) }} KB)
						</span>
						<p v-if="message" class="upload-error">{{ message }}</p>
						<div
							v-if="phase === 'uploading' || (pending && phase === 'idle')"
							class="progress"
							role="progressbar"
							:aria-valuenow="progress"
							aria-valuemin="0"
							aria-valuemax="100"
						>
							<div
								class="progress-bar"
								:style="{ width: `${progress}%` }"
							></div>
						</div>
						<p v-if="phase === 'done'" class="upload-done">
							Avatar updated.
						</p>
					</div>
				</section>
			</aside>

			<div class="profile-forms">
				<section class="panel">
					<h2>Profile information</h2>
					<form @submit.prevent="submitInfo" novalidate>
						<Field id="name" label="Name" :error="info.errors.name">
							<input
								id="name"
								type="text"
								name="name"
								autocomplete="name"
								v-model="info.name"
								@change="info.clearErrors('name')"
							/>
						</Field>
						<Field id="email" label="Email" :error="info.errors.email">
							<input
								id="email"
								type="email"
								name="email"
								autocomplete="email"
								v-model="info.email"
								@change="info.clearErrors('email')"
							/>
						</Field>
						<button
							class="btn btn-primary"
							type="submit"
							:disabled="info.processing"
						>
							{{ info.processing ? "Saving…" : "Save changes" }}
						</button>
					</form>
				</section>

				<section class="panel">
					<h2>Change password</h2>
					<form @submit.prevent="submitPass" novalidate>
						<Field
							id="currentPassword"
							label="Current password"
							:error="pass.errors.currentPassword"
						>
							<input
								id="currentPassword"
								type="password"
								name="currentPassword"
								autocomplete="current-password"
								v-model="pass.currentPassword"
								@change="pass.clearErrors('currentPassword')"
							/>
						</Field>
						<Field id="password" label="New password" :error="pass.errors.password">
							<input
								id="password"
								type="password"
								name="password"
								autocomplete="new-password"
								v-model="pass.password"
								@change="pass.clearErrors('password')"
							/>
						</Field>
						<Field
							id="passwordConfirmation"
							label="Confirm new password"
							:error="pass.errors.passwordConfirmation"
						>
							<input
								id="passwordConfirmation"
								type="password"
								name="passwordConfirmation"
								autocomplete="new-password"
								v-model="pass.passwordConfirmation"
								@change="pass.clearErrors('passwordConfirmation')"
							/>
						</Field>
						<button
							class="btn btn-primary"
							type="submit"
							:disabled="pass.processing"
						>
							{{ pass.processing ? "Updating…" : "Update password" }}
						</button>
					</form>
				</section>
			</div>
		</div>
	</Layout>
</template>

<style scoped>
/* Profile: two-column layout, avatar, upload, progress. */

.profile-grid {
	display: grid;
	grid-template-columns: 300px 1fr;
	gap: 1.25rem;
	align-items: start;
}

.profile-aside {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.profile-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 0.5rem;
}

.profile-name {
	margin: 0;
}

.profile-meta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.profile-since {
	color: var(--muted);
	font-size: 0.85rem;
}

.profile-upload {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	margin-top: 0.75rem;
}

.profile-forms {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

@media (max-width: 768px) {
	.profile-grid {
		grid-template-columns: 1fr;
	}
}

/* Avatar row (used in profile header). */

.avatar-row {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.25rem;
}

.avatar-row-name {
	margin: 0;
}

/* Upload zone. */

.upload-zone {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
	padding: 1.25rem;
	border: 1px dashed var(--border);
	border-radius: var(--radius);
}

.upload-file {
	color: var(--muted);
	font-size: 0.85rem;
}

.upload-error {
	color: #b91c1c;
	font-size: 0.85rem;
	margin: 0;
}

.upload-done {
	color: #15803d;
	font-weight: 600;
	margin-top: 0.75rem;
}

/* Progress bar. */

.progress {
	margin-top: 1rem;
	height: 8px;
	border-radius: 999px;
	background: var(--border);
	overflow: hidden;
}

.progress-bar {
	height: 100%;
	border-radius: 999px;
	background: var(--primary);
	transition: width 120ms ease;
}
</style>
