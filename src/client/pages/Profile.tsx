import { Head, router, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'

const CHUNK_SIZE = 256 * 1024

/** tus `Upload-Metadata` values are standard base64. */
function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function statusMessage(res: Response): string {
  return `Request failed (HTTP ${res.status})`
}

type PendingUpload = { id: string; name: string; size: number }
const PENDING_KEY = 'dulak:avatar:upload'

export default function Profile() {
  const { props } = usePage()
  const user = props.auth.user
  const inputRef = useRef<HTMLInputElement>(null)

  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  // Pick up an interrupted upload after a refresh (offset is re-read via HEAD).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      if (raw) setPending(JSON.parse(raw) as PendingUpload)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (pending) localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    else localStorage.removeItem(PENDING_KEY)
  }, [pending])

  /** Upload (or resume) `file` against upload id `id` ('' = create a new one). */
  async function runUpload(id: string, file: File) {
    setPhase('uploading')
    setMessage(null)
    setProgress(0)

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
        setPhase('error')
        setMessage(statusMessage(create))
        return
      }
      const location = create.headers.get('Location')
      if (!location) {
        setPhase('error')
        setMessage('Server did not return an upload URL')
        return
      }
      uploadId = location.split('/').pop() ?? ''
      setPending({ id: uploadId, name: file.name, size: file.size })
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
        setPhase('error')
        setMessage(statusMessage(res))
        return
      }
      offset = end
      setProgress(Math.round((offset / bytes.byteLength) * 100))
    }

    const link = await fetch('/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId }),
    })
    if (!link.ok) {
      setPhase('error')
      setMessage(statusMessage(link))
      return
    }
    setPending(null)
    setPhase('done')
    router.reload() // refresh shared props so the header avatar updates
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    // Same file as the interrupted upload? Resume it. Otherwise start fresh.
    if (pending && pending.name === file.name) void runUpload(pending.id, file)
    else void runUpload('', file)
  }

  if (!user) return null // guarded server-side by requireAuth

  return (
    <Layout>
      <Head title="Profile" />
      <h1>Profile</h1>
      <p className="page-sub">
        Upload an avatar — bytes travel through the tus resumable-upload protocol
        at /uploads (create → chunked PATCH → resume).
      </p>

      <section className="panel">
        <div className="avatar-row">
          {user.avatarUrl ? (
            <img className="avatar avatar-lg avatar-img" src={user.avatarUrl} alt="" />
          ) : (
            <span className="avatar avatar-lg" aria-hidden="true">
              {user.name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? '')
                .join('') || '?'}
            </span>
          )}
          <div>
            <h2 className="avatar-row-name">{user.name}</h2>
            <p className="page-sub">{user.email}</p>
          </div>
        </div>

        <div className="upload-zone">
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
          <button
            type="button"
            className="btn btn-primary"
            disabled={phase === 'uploading'}
            onClick={() => inputRef.current?.click()}
          >
            {phase === 'uploading' ? 'Uploading…' : pending ? 'Resume upload' : 'Choose image'}
          </button>
          {pending ? (
            <span className="upload-file">
              {pending.name} ({Math.max(1, Math.round(pending.size / 1024))} KB)
            </span>
          ) : null}
          {message ? <p className="upload-error">{message}</p> : null}
        </div>

        {phase === 'uploading' || (pending && phase === 'idle') ? (
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        {phase === 'done' ? <p className="upload-done">Avatar updated.</p> : null}
      </section>
    </Layout>
  )
}
