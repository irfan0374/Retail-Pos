import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import {
  createPurchase,
  createPurchaseReturn,
  getPurchaseWithItems,
  listPurchaseReturns,
  listPurchases
} from '../db/repositories/purchases.repo'
import { listStockMovements } from '../db/repositories/stockMovements.repo'

const newPurchaseSchema = z.object({
  supplierId: z.number(),
  invoiceRef: z.string().nullable(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        qty: z.number().positive(),
        unitCost: z.number().nonnegative()
      })
    )
    .min(1)
})

const newPurchaseReturnSchema = z.object({
  purchaseId: z.number(),
  reason: z.string().nullable(),
  items: z
    .array(
      z.object({
        purchaseItemId: z.number(),
        productId: z.number(),
        qty: z.number().positive(),
        unitCost: z.number().nonnegative()
      })
    )
    .min(1)
})

export function registerPurchaseHandlers(): void {
  ipcMain.handle(IPC.PURCHASES_LIST, (_event, filter) => {
    requirePermission('purchases.read')
    return listPurchases(filter)
  })

  ipcMain.handle(IPC.PURCHASES_GET, (_event, id) => {
    requirePermission('purchases.read')
    return getPurchaseWithItems(Number(id))
  })

  ipcMain.handle(IPC.PURCHASES_CREATE, (_event, payload) => {
    const user = requirePermission('purchases.write')
    const input = newPurchaseSchema.parse(payload)
    return createPurchase(input, user.id)
  })

  ipcMain.handle(IPC.PURCHASE_RETURNS_LIST, (_event, filter) => {
    requirePermission('purchases.read')
    return listPurchaseReturns(filter)
  })

  ipcMain.handle(IPC.PURCHASE_RETURNS_CREATE, (_event, payload) => {
    const user = requirePermission('purchases.write')
    const input = newPurchaseReturnSchema.parse(payload)
    return createPurchaseReturn(input, user.id)
  })

  ipcMain.handle(IPC.STOCK_MOVEMENTS_LIST, (_event, filter) => {
    requirePermission('purchases.read')
    return listStockMovements(filter)
  })
}
