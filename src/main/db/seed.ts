import type Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

/**
 * First-run only: creates a default admin so there's a way to log in before anyone else exists.
 * Logged to console (not audit_log, since there's no logged-in user yet) so it's visible on first boot.
 */
export function seedDefaultAdminIfEmpty(db: Database.Database): void {
  const userCount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n
  if (userCount > 0) return

  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10)
  db.prepare(
    `INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, 'admin')`
  ).run('Administrator', DEFAULT_ADMIN_USERNAME, passwordHash)

  console.log(
    `[seed] Created default admin user — username: "${DEFAULT_ADMIN_USERNAME}", password: "${DEFAULT_ADMIN_PASSWORD}". Change this after first login.`
  )
}
