import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requireSession } from '../services/auth.service'
import { createHeldSale, deleteHeldSale, getHeldSaleWithItems, listHeldSales } from '../db/repositories/heldSales.repo'

const newHeldSaleSchema = z.object({
  note: z.string().nullable(),
  billDiscountAmount: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        description: z.string().min(1),
        qty: z.number().positive(),
        unitPrice: z.number(),
        discountAmount: z.number().nonnegative(),
        isExchangeItem: z.boolean()
      })
    )
    .min(1)
})

export function registerHeldSaleHandlers(): void {
  ipcMain.handle(IPC.HELD_SALES_LIST, () => {
    requireSession()
    return listHeldSales()
  })

  ipcMain.handle(IPC.HELD_SALES_GET, (_event, id) => {
    requireSession()
    return getHeldSaleWithItems(Number(id))
  })

  ipcMain.handle(IPC.HELD_SALES_CREATE, (_event, payload) => {
    const user = requireSession()
    const input = newHeldSaleSchema.parse(payload)
    return createHeldSale(input, user.id)
  })

  ipcMain.handle(IPC.HELD_SALES_DELETE, (_event, id) => {
    requireSession()
    deleteHeldSale(Number(id))
  })
}
