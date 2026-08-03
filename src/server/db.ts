/**
 * bun:sqlite layer — synchronous, zero-ORM.
 * Schema comes from migrations/ (see migrations.ts); statements are
 * prepared once, after migrations are applied.
 */
import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { migrate } from './migrations'

export interface UserRow {
  id: number
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

/** The user shape that may leave the server (never includes passwordHash). */
export type PublicUser = Omit<UserRow, 'passwordHash'>

export const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt,
})

export interface SessionRow {
  token: string
  userId: number
  flash: string
  expiresAt: string
  createdAt: string
}

const dbPath = process.env.DATABASE_PATH ?? './data/app.sqlite'
mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath, { create: true })
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// Apply pending migrations before any statement is prepared/used.
migrate(db)

const USER_COLUMNS = 'id, name, email, password_hash AS passwordHash, created_at AS createdAt'

export const createUser = db.query<{ id: number }, [string, string, string]>(
  `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id`,
)
export const findUserByEmail = db.query<UserRow, [string]>(
  `SELECT ${USER_COLUMNS} FROM users WHERE email = ?`,
)
export const findUserById = db.query<UserRow, [number]>(
  `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
)
export const countUsers = db.query<{ n: number }, []>(`SELECT COUNT(*) AS n FROM users`)
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
