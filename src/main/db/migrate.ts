import type Database from 'better-sqlite3'
import m001Init from './migrations/001_init.sql?raw'
import m002Purchases from './migrations/002_purchases.sql?raw'
import m003Settings from './migrations/003_settings.sql?raw'

interface Migration {
  name: string
  sql: string
}

/** Ordered list of migrations. Add new entries here (never edit an already-applied one). */
const MIGRATIONS: Migration[] = [
  { name: '001_init', sql: m001Init },
  { name: '002_purchases', sql: m002Purchases },
  { name: '003_settings', sql: m003Settings }
]

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    db.prepare('SELECT name FROM schema_migrations').all().map((row) => (row as { name: string }).name)
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue
    const apply = db.transaction(() => {
      db.exec(migration.sql)
      db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(migration.name)
    })
    apply()
  }
}
