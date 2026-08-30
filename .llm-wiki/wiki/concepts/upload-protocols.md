---
type: concept
title: "Upload protocols: multipart ≤100MB + Bun.Image, tus >100MB"
slug: upload-protocols
status: canonical
created: 2026-08-30
updated: 2026-08-30
relevance: high
tags: ["upload", "multipart", "tus", "bun-image", "avatar", "architecture"]
---
# Upload protocols: multipart ≤100MB + Bun.Image, tus >100MB

Dulak boilerplate punya dua protokol upload yang berbeda untuk dua use case berbeda.

## 1. Regular upload (multipart/form-data) — file ≤ 100MB

**Route:** `POST /profile/avatar` di `src/server/routes/profile.routes.ts`

**Flow:**

1. Client kirim `FormData` dengan field `avatar` (via `XMLHttpRequest` untuk progress bar)
2. Server parse `c.req.formData()` → dapat `Blob` (bukan `File` — Hono return Blob)
3. Validate: type check (PNG/JPEG/GIF/WebP), 10MB cap
4. Read `Blob.arrayBuffer()` → pass bytes ke `new Image(bytes, { maxPixels, autoOrient })`
5. `Bun.Image` decode → `.resize(256, 256, { fit: "inside" })` → `.webp({ quality: 80 })` → `.bytes()`
6. Store via `writeBytes(id, out)` + `insertUpload.run(...)` dengan metadata `filetype: "image/webp"`
7. `updateUserAvatar.run(/uploads/${id}, user.id)`
8. Served from `GET /uploads/<id>` as `image/webp`

**Key gotchas:**

- `import { Image } from "bun"` — bukan global `Bun.Image` (undefined di server context)
- `file instanceof Blob` — bukan `instanceof File` (Hono return Blob)
- Avatar selalu raster WebP — SVG ditolak di type check (stored-XSS guard)

## 2. tus protocol v1 — file > 100MB

**Route:** `/uploads/*` di `src/server/routes/uploads.routes.ts`

**Extensions:** creation, creation-with-upload, termination, expiration, checksum

**Files:**

- `tus-protocol.ts` — constants, header helpers, metadata parser, checksum verifier
- `tus-storage.ts` — on-disk storage (`appendBytes`, `writeBytes`, `readBytes`, `fileSize`, `removeFile`)
- `uploads.routes.ts` — all tus handlers inline (POST/HEAD/PATCH/DELETE/GET)

**State:** SQLite `uploads` table (id, upload_length, offset, metadata, user_id, path, expires_at)

**Auth:** Session cookie resolved inside handlers (not via Hono middleware)

## When to use which

- Avatar/profile images → multipart + Bun.Image (always ≤ 100MB, need resize/re-encode)
- Large file uploads (> 100MB) → tus (resumable, chunked, reliable on bad connections)

## How to replicate: multipart image upload in a new route

Untuk menambah image upload di route baru (e.g. product image, cover photo):

### Server (route file)

```ts
import { Image } from "bun"; // WAJIB import, bukan global Bun.Image
import { generateUploadId } from "../tus-protocol";
import { uploadPath, writeBytes } from "../tus-storage";
import { insertUpload } from "../db";

// Di dalam route handler:
const form = await c.req.formData();
const file = form.get("fieldName"); // field name sesuai kebutuhan
if (!(file instanceof Blob)) return new Response("No file", { status: 422 });

// 1. Validate type + size
const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];
if (!ALLOWED.includes(file.type)) return new Response("Invalid type", { status: 422 });
if (file.size > 10 * 1024 * 1024) return new Response("Too large", { status: 413 });

// 2. Decode → resize → re-encode via Bun.Image
const bytes = new Uint8Array(await file.arrayBuffer());
const out = await new Image(bytes, { maxPixels: 4096*4096, autoOrient: true })
  .resize(WIDTH, HEIGHT, { fit: "inside" })
  .webp({ quality: 80 })
  .bytes();

// 3. Store + link
const id = generateUploadId();
await writeBytes(id, out);
insertUpload.run(id, out.byteLength, JSON.stringify({ filetype: "image/webp" }), userId, uploadPath(id), null);
// Update your table with /uploads/${id}
```

### Client (Svelte component)

```svelte
<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onchange={onFile} bind:this={inputRef} />
<button onclick={() => inputRef?.click()}>Upload</button>

<script>
  function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.append('fieldName', file)
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) progress = Math.round((ev.loaded / ev.total) * 100)
    }
    xhr.onload = () => { if (xhr.status === 204) router.reload() }
    xhr.open('POST', '/your-route')
    xhr.send(fd)
  }
</script>
```

### Checklist

- [ ] `import { Image } from "bun"` (bukan `Bun.Image` global)
- [ ] `file instanceof Blob` (bukan `File` — Hono return Blob)
- [ ] Validate type sebelum decode (SVG guard)
- [ ] Validate size sebelum decode (10MB cap)
- [ ] `await file.arrayBuffer()` sebelum pass ke `new Image()`
- [ ] `writeBytes` + `insertUpload` untuk store
- [ ] Serve dari `/uploads/<id>` (sudah ada `GET /uploads/:id`)

## How to replicate: tus upload for large files

tus protocol sudah self-contained di `tus-protocol.ts` + `tus-storage.ts` + `uploads.routes.ts`. Untuk project baru:

1. Copy ketiga file tersebut
2. Copy `uploads` table migration
3. Copy `insertUpload`, `findUpload`, `advanceOffset`, `deleteUpload`, `listExpired` dari `db.ts`
4. Mount `uploadsRoutes()` di `app.ts`
5. Set `UPLOAD_DIR`, `TUS_MAX_SIZE`, `TUS_EXPIRATION_SECONDS` di env

Tidak perlu modifikasi — tus handler framework-agnostic (Request/Response only).

## Related

- [[sources/obs-2026-08-30-two-upload-protocols-multipart-100mb-bun-image-tus-100mb]]
- [[sources/retro-bun-image-import-bukan-global-server-context]]
- [[sources/obs-2026-08-04-profile-page-with-tus-avatar-upload]]
- [[sources/obs-2026-08-04-tus-uploads-restructured-to-flat-convention]]
