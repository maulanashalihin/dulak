/**
 * On-disk storage for tus upload bytes. Files live at `<UPLOAD_DIR>/<id>`,
 * created lazily on the first PATCH (or on POST when creation-with-upload
 * sends a body). Appending is done with `node:fs/promises` `appendFile`.
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import {
	mkdirSync as mkdirSyncSync,
	rmSync as rmSyncSync,
	statSync as statSyncSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { config } from "./config";

const uploadDir = resolve(config.upload.dir);
mkdirSyncSync(uploadDir, { recursive: true });

/** Absolute path on disk for a given upload id. */
export function uploadPath(id: string): string {
	// Reject any traversal attempts in the id (ids are server-generated, but
	// defence in depth).
	if (!/^[A-Za-z0-9_-]{1,64}$/.test(id))
		throw new Error(`Invalid upload id: ${id}`);
	return join(uploadDir, id);
}

/** Append a Buffer/Uint8Array to the upload file. Returns bytes written. */
export async function appendBytes(
	id: string,
	data: Uint8Array,
): Promise<number> {
	await appendFile(uploadPath(id), data);
	return data.byteLength;
}

/** Write a complete file in one shot (used for server-side downloaded avatars). */
export async function writeBytes(id: string, data: Uint8Array): Promise<void> {
	await writeFile(uploadPath(id), data);
}

/** Read the stored bytes of an upload (used to serve the file back). */
export async function readBytes(id: string): Promise<Buffer> {
	return readFile(uploadPath(id));
}

/** Current size of the stored file (used to reconcile offset on HEAD). */
export function fileSize(id: string): number {
	try {
		return statSyncSync(uploadPath(id)).size;
	} catch {
		return 0;
	}
}

/** Remove the on-disk file (best-effort, used on termination/sweep). */
export function removeFile(id: string): void {
	try {
		rmSyncSync(uploadPath(id), { force: true });
	} catch {
		/* ignore — file may already be gone */
	}
}
