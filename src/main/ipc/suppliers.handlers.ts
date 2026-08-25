import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import {
  createSupplier,
  createSupplierPayment,
  getSupplierLedger,
  listSupplierPayments,
  listSuppliers,
  searchSuppliers,
  updateSupplier
} from '../db/repositories/suppliers.repo'

const newSupplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable(),
  address: z.string().nullable()
})

const updateSupplierSchema = newSupplierSchema.extend({ id: z.number() })

const newSupplierPaymentSchema = z.object({
  supplierId: z.number(),
  amount: z.number().positive(),
  method: z.string().nullable(),
  note: z.string().nullable()
})

export function registerSupplierHandlers(): void {
  ipcMain.handle(IPC.SUPPLIERS_LIST, () => {
    requirePermission('purchases.read')
    return listSuppliers()
  })

  ipcMain.handle(IPC.SUPPLIERS_SEARCH, (_event, query) => {
    requirePermission('purchases.read')
    return searchSuppliers(String(query ?? ''))
  })

  ipcMain.handle(IPC.SUPPLIERS_CREATE, (_event, payload) => {
    const user = requirePermission('purchases.write')
    const input = newSupplierSchema.parse(payload)
    const supplier = createSupplier(input)
    recordAuditLog({
      userId: user.id,
      action: 'suppliers.create',
      tableName: 'suppliers',
      recordId: supplier.id,
      details: { name: supplier.name }
    })
    return supplier
  })

  ipcMain.handle(IPC.SUPPLIERS_UPDATE, (_event, payload) => {
    const user = requirePermission('purchases.write')
    const input = updateSupplierSchema.parse(payload)
    const supplier = updateSupplier(input)
    recordAuditLog({
      userId: user.id,
      action: 'suppliers.update',
      tableName: 'suppliers',
      recordId: supplier.id,
      details: { name: supplier.name }
    })
    return supplier
  })

  ipcMain.handle(IPC.SUPPLIERS_GET_LEDGER, (_event, supplierId) => {
    requirePermission('purchases.read')
    return getSupplierLedger(Number(supplierId))
  })

  ipcMain.handle(IPC.SUPPLIER_PAYMENTS_LIST, (_event, supplierId) => {
    requirePermission('purchases.read')
    return listSupplierPayments(Number(supplierId))
  })

  ipcMain.handle(IPC.SUPPLIER_PAYMENTS_CREATE, (_event, payload) => {
    const user = requirePermission('purchases.write')
    const input = newSupplierPaymentSchema.parse(payload)
    const payment = createSupplierPayment(input, user.id)
    recordAuditLog({
      userId: user.id,
      action: 'supplierPayments.create',
      tableName: 'supplier_payments',
      recordId: payment.id,
      details: { supplierId: input.supplierId, amount: input.amount }
    })
    return payment
  })
}
