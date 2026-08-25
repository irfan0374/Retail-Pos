import type Database from 'better-sqlite3'
import { getDb } from '../index'

/**
 * Pass `db` explicitly when called inside another repository's transaction (e.g. sales.finalize)
 * so the audit row commits atomically with the action it's recording; omit it for standalone calls.
 */
export function recordAuditLog(
  entry: { userId: number | null; action: string; tableName?: string; recordId?: number; details?: unknown },
  db: Database.Database = getDb()
): void {
  db.prepare(
    `INSERT INTO audit_log (user_id, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?)`
  ).run(
    entry.userId,
    entry.action,
    entry.tableName ?? null,
    entry.recordId ?? null,
    entry.details !== undefined ? JSON.stringify(entry.details) : null
  )
}
