export interface AuditLogEntry {
  id: number
  userId: number | null
  action: string
  tableName: string | null
  recordId: number | null
  details: string | null
  timestamp: string
}

export interface AuditLogFilter {
  dateFrom?: string
  dateTo?: string
  userId?: number
  action?: string
}
