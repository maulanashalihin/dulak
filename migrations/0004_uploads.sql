-- 0004_uploads.sql — tus resumable upload metadata.
-- The actual bytes live on disk under UPLOAD_DIR/<id>; this table only
-- tracks offset, length, owner and optional expiration.

CREATE TABLE IF NOT EXISTS uploads (
  id            TEXT PRIMARY KEY,           -- base64url random, URL-safe
  upload_length INTEGER NOT NULL,           -- total size in bytes (Upload-Length)
  offset        INTEGER NOT NULL DEFAULT 0, -- bytes already stored
  metadata      TEXT    NOT NULL DEFAULT '{}', -- JSON of Upload-Metadata pairs
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  path          TEXT    NOT NULL,           -- absolute file path on disk
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at    TEXT                        -- Expiration extension (nullable)
);

CREATE INDEX IF NOT EXISTS idx_uploads_user_id    ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_expires_at ON uploads(expires_at) WHERE expires_at IS NOT NULL;
