-- 0002_sessions.sql — DB-backed sessions.
-- token_hash (SHA-256 of the raw cookie token) is the PK so that a
-- database leak does not expose valid session tokens.

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flash      TEXT    NOT NULL DEFAULT '{}',
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
