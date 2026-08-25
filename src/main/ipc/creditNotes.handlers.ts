import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { createCreditNote, listCreditNotes } from '../db/repositories/creditNotes.repo'

const newCreditNoteSchema = z.object({
  saleId: z.number(),
  reason: z.string().nullable(),
  items: z
    .array(
      z.object({
        saleItemId: z.number(),
        qty: z.number().positive()
      })
    )
    .min(1)
})

export function registerCreditNoteHandlers(): void {
  ipcMain.handle(IPC.CREDIT_NOTES_LIST, (_event, filter) => {
    requirePermission('sales.void')
    return listCreditNotes(filter)
  })

  ipcMain.handle(IPC.CREDIT_NOTES_CREATE, (_event, payload) => {
    const user = requirePermission('sales.void')
    const input = newCreditNoteSchema.parse(payload)
    return createCreditNote(input, user.id)
  })
}
