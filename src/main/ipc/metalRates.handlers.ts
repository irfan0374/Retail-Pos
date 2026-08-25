import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import { listLatestMetalRates, upsertMetalRate } from '../db/repositories/metalRates.repo'

const upsertSchema = z.object({
  date: z.string().min(1),
  metalType: z.enum(['gold', 'silver', 'platinum', 'imitation']),
  purity: z.string().min(1),
  ratePerGram: z.number().positive()
})

export function registerMetalRateHandlers(): void {
  ipcMain.handle(IPC.METAL_RATES_LIST_LATEST, () => {
    requirePermission('products.read')
    return listLatestMetalRates()
  })

  ipcMain.handle(IPC.METAL_RATES_UPSERT, (_event, payload) => {
    const user = requirePermission('metalRates.write')
    const input = upsertSchema.parse(payload)
    const rate = upsertMetalRate(input, user.id)
    recordAuditLog({
      userId: user.id,
      action: 'metalRates.upsert',
      tableName: 'metal_rates',
      recordId: rate.id,
      details: input
    })
    return rate
  })
}
