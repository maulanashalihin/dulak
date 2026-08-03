/**
 * `bun run db:seed [email] [password]` — create a demo user.
 * Defaults: demo@example.com / password123
 */
import { hashPassword } from '../src/server/auth'
import { createUser, findUserByEmail } from '../src/server/db'

const email = process.argv[2] ?? 'demo@example.com'
const password = process.argv[3] ?? 'password123'

if (findUserByEmail.get(email)) {
  console.log(`User ${email} already exists.`)
  process.exit(0)
}

const passwordHash = await hashPassword(password)
createUser.get('Demo User', email, passwordHash)
console.log(`Seeded ${email} (password: ${password})`)
