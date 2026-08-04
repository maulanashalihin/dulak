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
</script>

<svelte:head><title>Profile</title></svelte:head>

{#if user}
  <Layout>
    <h1>Profile</h1>
    <p class="page-sub">
      Manage your account — avatar, profile information and password.
    </p>

    <div class="profile-grid">
      <aside class="profile-aside">
        <section class="panel profile-card">
          {#if user.avatarUrl}
            <img
              class="avatar avatar-lg avatar-img"
              src={user.avatarUrl}
              alt=""
            />
          {:else}
            <span class="avatar avatar-lg" aria-hidden="true">
              {user.name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? '')
                .join('') || '?'}
            </span>
          {/if}
          <h2 class="profile-name">{user.name}</h2>
          <p class="page-sub">{user.email}</p>
          <div class="profile-meta">
            <span class="badge badge-user">{user.role}</span>
            <span class="profile-since">
              Member since {formatDate(user.createdAt)}
            </span>
          </div>

          <div class="profile-upload">
            <input
              bind:this={inputRef}
              type="file"
              accept="image/*"
              hidden
              onchange={onFile}
            />
            <button
              type="button"
              class="btn btn-primary"
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
              <span class="upload-file">
                {pending.name} ({Math.max(1, Math.round(pending.size / 1024))} KB)
              </span>
            {/if}
            {#if message}
              <p class="upload-error">{message}</p>
            {/if}
            {#if phase === 'uploading' || (pending && phase === 'idle')}
              <div
                class="progress"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div class="progress-bar" style={`width: ${progress}%`}></div>
              </div>
            {/if}
            {#if phase === 'done'}
              <p class="upload-done">Avatar updated.</p>
            {/if}
          </div>
        </section>
      </aside>

      <div class="profile-forms">
        <section class="panel">
          <h2>Profile information</h2>
          <form onsubmit={submitInfo} novalidate>
            <Field id="name" label="Name" error={info.errors.name}>
              <input
                id="name"
                type="text"
                name="name"
                autocomplete="name"
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
                bind:value={info.email}
                onchange={() => info.clearErrors('email')}
              />
            </Field>
            <button
              class="btn btn-primary"
              type="submit"
              disabled={info.processing}
            >
              {info.processing ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        <section class="panel">
          <h2>Change password</h2>
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
                bind:value={pass.passwordConfirmation}
                onchange={() => pass.clearErrors('passwordConfirmation')}
              />
            </Field>
            <button
              class="btn btn-primary"
              type="submit"
              disabled={pass.processing}
            >
              {pass.processing ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  </Layout>
{/if}
