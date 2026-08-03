/**
 * `bun run db:seed [email] [password] [role]` — create a demo user.
 * Defaults: demo@example.com / password123 / user.
 * Example: bun run db:seed admin@example.com admin123 admin
 */
import { hashPassword } from '../src/server/auth'
import { createUserWithRole, findUserByEmail } from '../src/server/db'

const email = process.argv[2] ?? 'demo@example.com'
const password = process.argv[3] ?? 'password123'
const role = (process.argv[4] ?? 'user').toLowerCase()

if (role !== 'user' && role !== 'admin') {
  console.error('Role must be "user" or "admin".')
  process.exit(1)
}

if (findUserByEmail.get(email)) {
  console.log(`User ${email} already exists.`)
  process.exit(0)
}

const passwordHash = await hashPassword(password)
createUserWithRole.get('Demo User', email, passwordHash, role)
console.log(`Seeded ${email} (password: ${password}, role: ${role})`)
