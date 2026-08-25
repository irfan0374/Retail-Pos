import type Database from 'better-sqlite3'
import { getDb } from '../index'
import type { AuditLogEntry, AuditLogFilter } from '@shared/types/auditLog'

interface AuditLogRow {
  id: number
  user_id: number | null
  action: string
  table_name: string | null
  record_id: number | null
  details: string | null
  timestamp: string
}

function toAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    tableName: row.table_name,
    recordId: row.record_id,
    details: row.details,
    timestamp: row.timestamp
  }
}

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

export function listAuditLog(filter: AuditLogFilter): AuditLogEntry[] {
  const clauses: string[] = []
  const params: unknown[] = []

  if (filter.dateFrom) {
    clauses.push('date(timestamp) >= date(?)')
    params.push(filter.dateFrom)
  }
  if (filter.dateTo) {
    clauses.push('date(timestamp) <= date(?)')
    params.push(filter.dateTo)
  }
  if (filter.userId) {
    clauses.push('user_id = ?')
    params.push(filter.userId)
  }
  if (filter.action) {
    clauses.push('action = ?')
    params.push(filter.action)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = getDb()
    .prepare(`SELECT * FROM audit_log ${where} ORDER BY id DESC LIMIT 500`)
    .all(...params) as AuditLogRow[]
  return rows.map(toAuditLogEntry)
}
