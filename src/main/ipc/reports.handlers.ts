import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { listUsers } from '../db/repositories/users.repo'
import {
  getMonthlySummary,
  getVatSummary,
  getZReport,
  listSalesWithItemsInRange,
  searchSales
} from '../db/repositories/sales.repo'
import { listPurchasesWithItemsInRange } from '../db/repositories/purchases.repo'
import { listSuppliers } from '../db/repositories/suppliers.repo'
import { listProducts } from '../db/repositories/products.repo'
import { getSettings } from '../db/repositories/settings.repo'
import {
  exportPurchaseRegister,
  exportSalesRegister,
  exportVatReport,
  type PurchaseRegisterRow,
  type SalesRegisterRow
} from '../services/excelExport.service'

const salesHistoryFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cashierId: z.number().optional(),
  paymentMethod: z.enum(['cash', 'card']).optional(),
  productId: z.number().optional()
})

const dateRangeSchema = z.object({
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1)
})

export function registerReportHandlers(): void {
  ipcMain.handle(IPC.REPORTS_SALES_HISTORY, (_event, payload) => {
    requirePermission('reports.financial')
    const filter = salesHistoryFilterSchema.parse(payload ?? {})
    return searchSales(filter)
  })

  ipcMain.handle(IPC.REPORTS_USERS_LIST, () => {
    requirePermission('reports.financial')
    return listUsers()
  })

  ipcMain.handle(IPC.REPORTS_MONTHLY_SUMMARY, () => {
    requirePermission('reports.financial')
    return getMonthlySummary()
  })

  ipcMain.handle(IPC.REPORTS_VAT_SUMMARY, (_event, dateFrom, dateTo) => {
    requirePermission('reports.financial')
    const range = dateRangeSchema.parse({ dateFrom, dateTo })
    return getVatSummary(range.dateFrom, range.dateTo)
  })

  ipcMain.handle(IPC.REPORTS_Z_REPORT, (_event, date) => {
    requirePermission('reports.financial')
    return getZReport(z.string().min(1).parse(date))
  })

  ipcMain.handle(IPC.REPORTS_EXPORT_SALES_REGISTER, async (_event, dateFrom, dateTo) => {
    requirePermission('reports.financial')
    const range = dateRangeSchema.parse({ dateFrom, dateTo })
    const sales = listSalesWithItemsInRange(range.dateFrom, range.dateTo)
    const rows: SalesRegisterRow[] = sales.flatMap((sale) =>
      sale.items.map((item) => ({
        invoiceNo: sale.invoiceNo,
        date: sale.createdAt,
        item: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discount: item.discountAmount,
        vat: item.vatAmount,
        lineTotal: item.lineTotal,
        paymentMethod: sale.paymentMethod
      }))
    )
    return exportSalesRegister(rows)
  })

  ipcMain.handle(IPC.REPORTS_EXPORT_VAT_REPORT, async (_event, dateFrom, dateTo) => {
    requirePermission('reports.financial')
    const range = dateRangeSchema.parse({ dateFrom, dateTo })
    const summary = getVatSummary(range.dateFrom, range.dateTo)
    const settings = getSettings()
    return exportVatReport(summary, settings)
  })

  ipcMain.handle(IPC.REPORTS_EXPORT_PURCHASE_REGISTER, async (_event, dateFrom, dateTo) => {
    requirePermission('reports.financial')
    const range = dateRangeSchema.parse({ dateFrom, dateTo })
    const purchases = listPurchasesWithItemsInRange(range.dateFrom, range.dateTo)
    const suppliersById = Object.fromEntries(listSuppliers().map((s) => [s.id, s.name]))
    const productsById = Object.fromEntries(listProducts().map((p) => [p.id, p.name]))
    const rows: PurchaseRegisterRow[] = purchases.flatMap((purchase) =>
      purchase.items.map((item) => ({
        purchaseId: purchase.id,
        date: purchase.date,
        invoiceRef: purchase.invoiceRef ?? '',
        supplierName: suppliersById[purchase.supplierId] ?? `#${purchase.supplierId}`,
        productName: productsById[item.productId] ?? `#${item.productId}`,
        qty: item.qty,
        unitCost: item.unitCost,
        lineTotal: item.lineTotal
      }))
    )
    return exportPurchaseRegister(rows)
  })
}
