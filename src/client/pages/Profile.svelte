<script lang="ts">
  import { router, useForm, usePage } from '@inertiajs/svelte'
  import Layout from '../components/Layout.svelte'
  import Field from '../components/Field.svelte'

  const page = usePage()
  const user = $derived(page.props.auth.user)

  const CHUNK_SIZE = 256 * 1024
  const PENDING_KEY = 'dulak:avatar:upload'

  type PendingUpload = { id: string; name: string; size: number }
  type Phase = 'idle' | 'uploading' | 'done' | 'error'

  let info = $state(useForm({ name: '', email: '' }))
  let pass = $state(useForm({
    currentPassword: '',
    password: '',
    passwordConfirmation: '',
  }))
  let inputRef = $state<HTMLInputElement | null>(null)
  let pending = $state<PendingUpload | null>(null)
  let phase = $state<Phase>('idle')
  let progress = $state(0)
  let message = $state<string | null>(null)

  // Initialize form defaults from user once available.
  $effect(() => {
    if (user) {
      info = useForm({ name: user.name, email: user.email })
    }
  })

  // Pick up an interrupted upload after a refresh.
  $effect(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      if (raw) pending = JSON.parse(raw) as PendingUpload
    } catch {
      /* ignore */
    }
  })

  // Persist pending upload state.
  $effect(() => {
    if (pending) localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    else localStorage.removeItem(PENDING_KEY)
  })

  function toBase64(s: string): string {
    const bytes = new TextEncoder().encode(s)
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    return btoa(bin)
  }

  function statusMessage(res: Response): string {
    return `Request failed (HTTP ${res.status})`
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /** Upload (or resume) `file` against upload id `id` ('' = create a new one). */
  async function runUpload(id: string, file: File) {
    phase = 'uploading'
    message = null
    progress = 0

    let uploadId = id
    if (!uploadId) {
      const create = await fetch('/uploads', {
        method: 'POST',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(file.size),
          'Upload-Metadata': `filename ${toBase64(file.name)},filetype ${toBase64(file.type)}`,
        },
      })
      if (!create.ok) {
        phase = 'error'
        message = statusMessage(create)
        return
      }
      const location = create.headers.get('Location')
      if (!location) {
        phase = 'error'
        message = 'Server did not return an upload URL'
        return
      }
      uploadId = location.split('/').pop() ?? ''
      pending = { id: uploadId, name: file.name, size: file.size }
    }

    // Reconcile the offset with the server so an interrupted upload resumes.
    const head = await fetch(`/uploads/${uploadId}`, {
      method: 'HEAD',
      headers: { 'Tus-Resumable': '1.0.0' },
    })
    let offset = 0
    if (head.ok) {
      const h = head.headers.get('Upload-Offset')
      offset = h ? Number(h) || 0 : 0
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    while (offset < bytes.byteLength) {
      const end = Math.min(offset + CHUNK_SIZE, bytes.byteLength)
      const res = await fetch(`/uploads/${uploadId}`, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(offset),
        },
        body: bytes.slice(offset, end),
      })
      if (!res.ok) {
        phase = 'error'
        message = statusMessage(res)
        return
      }
      offset = end
      progress = Math.round((offset / bytes.byteLength) * 100)
    }

    const link = await fetch('/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId }),
    })
    if (!link.ok) {
      phase = 'error'
      message = statusMessage(link)
      return
    }
    pending = null
    phase = 'done'
    router.reload()
  }

  function onFile(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    target.value = '' // allow re-selecting the same file
    if (!file) return
    if (pending && pending.name === file.name) void runUpload(pending.id, file)
    else void runUpload('', file)
  }

  function submitInfo(e: SubmitEvent) {
    e.preventDefault()
    info.patch('/profile')
  }

  function submitPass(e: SubmitEvent) {
    e.preventDefault()
    pass.post('/profile/password')
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-border rounded-lg bg-bg text-text text-[0.95rem] focus:outline-2 focus:outline-primary focus:-outline-offset-1 focus:border-primary'

  const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed'
</script>

<svelte:head><title>Profile</title></svelte:head>

{#if user}
  <Layout>
    <h1 class="text-[1.6rem] m-0 mb-1 tracking-tight">Profile</h1>
    <p class="text-muted mb-3">
      Manage your account — avatar, profile information and password.
    </p>

    <div class="grid grid-cols-[300px_1fr] gap-5 items-start max-md:grid-cols-1">
      <aside class="flex flex-col gap-4">
        <section
          class="bg-surface border border-border rounded-radius p-6 flex flex-col items-center text-center gap-2"
        >
          {#if user.avatarUrl}
            <img
              class="w-11 h-11 rounded-full object-cover"
              src={user.avatarUrl}
              alt=""
            />
          {:else}
            <span
              class="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white text-sm font-bold shrink-0"
              aria-hidden="true"
            >
              {user.name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? '')
                .join('') || '?'}
            </span>
          {/if}
          <h2 class="m-0 text-[1.1rem]">{user.name}</h2>
          <p class="text-muted m-0">{user.email}</p>
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <span
              class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-primary-soft text-primary"
            >
              {user.role}
            </span>
            <span class="text-muted text-sm">
              Member since {formatDate(user.createdAt)}
            </span>
          </div>

          <div class="flex flex-col items-center gap-2 w-full mt-3">
            <input
              bind:this={inputRef}
              type="file"
              accept="image/*"
              hidden
              onchange={onFile}
            />
            <button
              type="button"
              class={btnPrimary}
              disabled={phase === 'uploading'}
              onclick={() => inputRef?.click()}
            >
              {phase === 'uploading'
                ? 'Uploading…'
                : pending
                  ? 'Resume upload'
                  : 'Change avatar'}
            </button>
            {#if pending}
              <span class="text-muted text-sm">
                {pending.name} ({Math.max(1, Math.round(pending.size / 1024))} KB)
              </span>
            {/if}
            {#if message}
              <p class="text-[#b91c1c] text-sm m-0">{message}</p>
            {/if}
            {#if phase === 'uploading' || (pending && phase === 'idle')}
              <div
                class="mt-4 h-2 rounded-full bg-border overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  class="h-full rounded-full bg-primary transition-[width] duration-[120ms] ease-out"
                  style={`width: ${progress}%`}
                ></div>
              </div>
            {/if}
            {#if phase === 'done'}
              <p class="text-green-700 font-semibold mt-3 m-0">Avatar updated.</p>
            {/if}
          </div>
        </section>
      </aside>

      <div class="flex flex-col gap-5">
        <section class="bg-surface border border-border rounded-radius p-6">
          <h2 class="text-[1.1rem] m-0 mb-3">Profile information</h2>
          <form onsubmit={submitInfo} novalidate>
            <Field id="name" label="Name" error={info.errors.name}>
              <input
                id="name"
                type="text"
                name="name"
                autocomplete="name"
                class={inputClass}
                bind:value={info.name}
                onchange={() => info.clearErrors('name')}
              />
            </Field>
            <Field id="email" label="Email" error={info.errors.email}>
              <input
                id="email"
                type="email"
                name="email"
                autocomplete="email"
                class={inputClass}
                bind:value={info.email}
                onchange={() => info.clearErrors('email')}
              />
            </Field>
            <button class={btnPrimary} type="submit" disabled={info.processing}>
              {info.processing ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        <section class="bg-surface border border-border rounded-radius p-6">
          <h2 class="text-[1.1rem] m-0 mb-3">Change password</h2>
          <form onsubmit={submitPass} novalidate>
            <Field
              id="currentPassword"
              label="Current password"
              error={pass.errors.currentPassword}
            >
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                autocomplete="current-password"
                class={inputClass}
                bind:value={pass.currentPassword}
                onchange={() => pass.clearErrors('currentPassword')}
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
                autocomplete="new-password"
                class={inputClass}
                bind:value={pass.password}
                onchange={() => pass.clearErrors('password')}
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
                autocomplete="new-password"
                class={inputClass}
                bind:value={pass.passwordConfirmation}
                onchange={() => pass.clearErrors('passwordConfirmation')}
              />
            </Field>
            <button class={btnPrimary} type="submit" disabled={pass.processing}>
              {pass.processing ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  </Layout>
{/if}
