/**
 * bun:sqlite layer — synchronous, zero-ORM.
 * Schema comes from migrations/ (see migrations.ts); statements are
 * prepared once, after migrations are applied.
 */
import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Role } from '../shared/types'
import { config } from './config'
import { migrate } from './migrations'

export interface UserRow {
  id: number
  name: string
  email: string
  passwordHash: string
  role: Role
  googleId: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface SessionRow {
  token: string
  userId: number
  flash: string
  expiresAt: string
  createdAt: string
}

export interface PasswordResetRow {
  email: string
  tokenHash: string
  expiresAt: string
}

/** The user shape that may leave the server (never includes passwordHash). */
export type PublicUser = Omit<UserRow, 'passwordHash' | 'googleId' | 'avatarUrl'>

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  createdAt: row.createdAt,
})

mkdirSync(dirname(config.dbPath), { recursive: true })

export const db = new Database(config.dbPath, { create: true })
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// Apply pending migrations before any statement is prepared/used.
migrate(db)

const USER_COLUMNS =
  'id, name, email, password_hash AS passwordHash, role, google_id AS googleId, avatar_url AS avatarUrl, created_at AS createdAt'

export const createUser = db.query<{ id: number }, [string, string, string]>(
  `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id`,
)
export const createUserWithRole = db.query<{ id: number }, [string, string, string, Role]>(
  `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id`,
)
export const createGoogleUser = db.query<{ id: number }, [string, string, string, string]>(
  `INSERT INTO users (name, email, password_hash, google_id, avatar_url) VALUES (?, ?, '', ?, ?) RETURNING id`,
)
export const findUserByEmail = db.query<UserRow, [string]>(
  `SELECT ${USER_COLUMNS} FROM users WHERE email = ?`,
)
export const findUserById = db.query<UserRow, [number]>(
  `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
)
export const findUserByGoogleId = db.query<UserRow, [string]>(
  `SELECT ${USER_COLUMNS} FROM users WHERE google_id = ?`,
)
export const linkGoogleAccount = db.query<null, [string, number]>(
  `UPDATE users SET google_id = ? WHERE id = ?`,
)
export const updateUserPassword = db.query<null, [string, number]>(
  `UPDATE users SET password_hash = ? WHERE id = ?`,
)
export const countUsers = db.query<{ n: number }, []>(`SELECT COUNT(*) AS n FROM users`)
export const listUsers = db.query<UserRow, [number, number]>(
  `SELECT ${USER_COLUMNS} FROM users ORDER BY id DESC LIMIT ? OFFSET ?`,
)
export const recentUsers = db.query<UserRow, [number]>(
  `SELECT ${USER_COLUMNS} FROM users ORDER BY id DESC LIMIT ?`,
)

export const insertSession = db.query<null, [string, number, string]>(
  `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
)
export const findSession = db.query<SessionRow, [string]>(
  `SELECT token, user_id AS userId, flash, expires_at AS expiresAt, created_at AS createdAt FROM sessions WHERE token = ?`,
)
export const deleteSession = db.query<null, [string]>(`DELETE FROM sessions WHERE token = ?`)
export const updateSessionFlash = db.query<null, [string, string]>(
  `UPDATE sessions SET flash = ? WHERE token = ?`,
)

export const insertPasswordReset = db.query<null, [string, string, string]>(
  `INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)`,
)
export const findPasswordReset = db.query<PasswordResetRow, [string]>(
  `SELECT email, token_hash AS tokenHash, expires_at AS expiresAt FROM password_resets WHERE token_hash = ?`,
)
export const deletePasswordResetsByEmail = db.query<null, [string]>(
  `DELETE FROM password_resets WHERE email = ?`,
)
