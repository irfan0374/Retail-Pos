export interface AuditLogEntry {
  id: number
  userId: number | null
  action: string
  tableName: string | null
  recordId: number | null
  details: string | null
  timestamp: string
}
