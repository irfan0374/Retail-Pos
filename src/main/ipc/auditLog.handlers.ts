import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { listAuditLog } from '../db/repositories/auditLog.repo'

const filterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  userId: z.number().optional(),
  action: z.string().optional()
})

export function registerAuditLogHandlers(): void {
  ipcMain.handle(IPC.AUDIT_LOG_LIST, (_event, payload) => {
    requirePermission('reports.financial')
    return listAuditLog(filterSchema.parse(payload ?? {}))
  })
}
