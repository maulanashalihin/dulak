/**
 * Minimal SQL migration runner — zero dependencies, matches the
 * bun:sqlite philosophy of the boilerplate.
 *
 * - SQL files live in `migrations/`, applied in filename order.
 * - Applied files are recorded in `schema_migrations`; each migration runs
 *   once, inside a transaction.
 * - Never edit an applied migration — add a new numbered file instead
 *   (e.g. `0002_add_posts.sql`).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Database } from 'bun:sqlite'

const MIGRATIONS_DIR = 'migrations'

export function migrate(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `)

  const applied = new Set(
    db.query<{ version: string }, []>(`SELECT version FROM schema_migrations`)
      .all()
      .map((row) => row.version),
  )

  if (!existsSync(MIGRATIONS_DIR)) return
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    const apply = db.transaction((version: string) => {
      db.exec(sql)
      db.query(`INSERT INTO schema_migrations (version) VALUES (?)`).run(version)
    })
    apply(file)
    console.log(`[migrate] applied ${file}`)
  }
}
