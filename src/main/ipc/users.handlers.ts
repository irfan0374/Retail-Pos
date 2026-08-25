import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { resetUserPin } from '../services/auth.service'
import { recordAuditLog } from '../db/repositories/auditLog.repo'

const resetPinSchema = z.object({
  userId: z.number(),
  newPin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits')
})

export function registerUserHandlers(): void {
  ipcMain.handle(IPC.USERS_RESET_PIN, (_event, payload) => {
    const admin = requirePermission('users.manage')
    const { userId, newPin } = resetPinSchema.parse(payload)
    resetUserPin(userId, newPin)
    recordAuditLog({ userId: admin.id, action: 'users.resetPin', tableName: 'users', recordId: userId })
  })
}
