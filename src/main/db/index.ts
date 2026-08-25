import { app } from 'electron'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { runMigrations } from './migrate'
import { seedDefaultAdminIfEmpty } from './seed'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'retailkey-pos.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  seedDefaultAdminIfEmpty(db)

  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized — call initDatabase() first')
  return db
}
