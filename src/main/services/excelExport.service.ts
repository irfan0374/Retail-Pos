import ExcelJS from 'exceljs'
import { BrowserWindow, dialog, type SaveDialogOptions } from 'electron'
import type { ExportResult } from '@shared/types/report'
import type { ShopSettings } from '@shared/types/settings'
import type { VatSummary } from '@shared/types/report'

const CURRENCY_FMT = '#,##0.00'

async function promptAndSave(workbook: ExcelJS.Workbook, suggestedName: string): Promise<ExportResult> {
  const options: SaveDialogOptions = {
    title: 'Export to Excel',
    defaultPath: suggestedName,
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
  }
  const win = BrowserWindow.getFocusedWindow()
  const { canceled, filePath } = await (win
    ? dialog.showSaveDialog(win, options)
    : dialog.showSaveDialog(options))
  if (canceled || !filePath) return { success: false }
  await workbook.xlsx.writeFile(filePath)
  return { success: true, filePath }
}

export interface SalesRegisterRow {
  invoiceNo: string
  date: string
  item: string
  qty: number
  unitPrice: number
  discount: number
  vat: number
  lineTotal: number
  paymentMethod: string
}

export async function exportSalesRegister(rows: SalesRegisterRow[]): Promise<ExportResult> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sales Register')
  sheet.columns = [
    { header: 'Invoice No', key: 'invoiceNo', width: 16 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Item', key: 'item', width: 30 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Unit Price (AED)', key: 'unitPrice', width: 14, style: { numFmt: CURRENCY_FMT } },
    { header: 'Discount (AED)', key: 'discount', width: 12, style: { numFmt: CURRENCY_FMT } },
    { header: 'VAT (AED)', key: 'vat', width: 12, style: { numFmt: CURRENCY_FMT } },
    { header: 'Line Total (AED)', key: 'lineTotal', width: 14, style: { numFmt: CURRENCY_FMT } },
    { header: 'Payment Method', key: 'paymentMethod', width: 16 }
  ]
  sheet.getRow(1).font = { bold: true }
  for (const row of rows) sheet.addRow(row)
  return promptAndSave(workbook, `sales-register-${Date.now()}.xlsx`)
}

export interface PurchaseRegisterRow {
  purchaseId: number
  date: string
  invoiceRef: string
  supplierName: string
  productName: string
  qty: number
  unitCost: number
  lineTotal: number
}

export async function exportPurchaseRegister(rows: PurchaseRegisterRow[]): Promise<ExportResult> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Purchase Register')
  sheet.columns = [
    { header: 'Purchase ID', key: 'purchaseId', width: 12 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Invoice Ref', key: 'invoiceRef', width: 16 },
    { header: 'Supplier', key: 'supplierName', width: 22 },
    { header: 'Product', key: 'productName', width: 28 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Unit Cost (AED)', key: 'unitCost', width: 14, style: { numFmt: CURRENCY_FMT } },
    { header: 'Line Total (AED)', key: 'lineTotal', width: 14, style: { numFmt: CURRENCY_FMT } }
  ]
  sheet.getRow(1).font = { bold: true }
  for (const row of rows) sheet.addRow(row)
  return promptAndSave(workbook, `purchase-register-${Date.now()}.xlsx`)
}

/** Laid out to match the shape of an FTA VAT return summary (standard-rated supplies box). */
export async function exportVatReport(summary: VatSummary, settings: ShopSettings): Promise<ExportResult> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('VAT Report')
  sheet.columns = [
    { key: 'label', width: 28 },
    { key: 'value', width: 26 }
  ]
  sheet.addRow(['Shop Name', settings.shopName])
  sheet.addRow(['TRN', settings.trn])
  sheet.addRow(['Address', settings.address])
  sheet.addRow(['Phone', settings.phone])
  sheet.addRow(['VAT Return Period', `${summary.dateFrom} to ${summary.dateTo}`])
  sheet.addRow([])
  sheet.addRow(['Number of Sales', summary.salesCount])
  const taxableRow = sheet.addRow(['Standard Rated Supplies — Taxable Amount (AED)', summary.taxableAmount])
  const vatRow = sheet.addRow(['Output VAT Due (5%) (AED)', summary.vatAmount])
  const totalRow = sheet.addRow(['Total Amount Including VAT (AED)', summary.totalAmount])
  taxableRow.getCell('value').numFmt = CURRENCY_FMT
  vatRow.getCell('value').numFmt = CURRENCY_FMT
  totalRow.getCell('value').numFmt = CURRENCY_FMT
  totalRow.font = { bold: true }
  sheet.getColumn('label').font = { bold: true }
  return promptAndSave(workbook, `vat-filing-${summary.dateFrom}-to-${summary.dateTo}.xlsx`)
}
