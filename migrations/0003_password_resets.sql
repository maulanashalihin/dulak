-- 0003_password_resets.sql — self-service password reset tokens.
-- token_hash is SHA-256 of the raw token sent in the email link.

CREATE TABLE IF NOT EXISTS password_resets (
  email      TEXT NOT NULL,
  token_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
