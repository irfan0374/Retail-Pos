import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { requireSession } from '../services/auth.service'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import { getSettings, updateSettings } from '../db/repositories/settings.repo'

const settingsSchema = z.object({
  shopName: z.string(),
  trn: z.string(),
  address: z.string(),
  phone: z.string(),
  idleLogoutMinutes: z.number().int().min(1).max(120),
  showOldGoldExchange: z.boolean(),
  showReturns: z.boolean(),
  showMetalRates: z.boolean()
})

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    requireSession()
    return getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, payload) => {
    const user = requirePermission('settings.write')
    const input = settingsSchema.parse(payload)
    const settings = updateSettings(input)
    recordAuditLog({ userId: user.id, action: 'settings.update', tableName: 'app_settings', details: input })
    return settings
  })
}
