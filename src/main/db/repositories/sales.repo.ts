import type Database from 'better-sqlite3'
import { getDb } from '../index'
import { decrementStock } from './products.repo'
import { recordAuditLog } from './auditLog.repo'
import { recordStockMovement } from './stockMovements.repo'
import { round2 } from '@shared/pricing'
import type { PaymentMethod, Sale, SaleItem, SaleWithItems } from '@shared/types/sale'
import type {
  MonthlySalesSummary,
  PaymentMethodBreakdown,
  SalesHistoryFilter,
  VatSummary,
  ZReport
} from '@shared/types/report'

interface SaleRow {
  id: number
  invoice_no: string
  created_at: string
  customer_id: number | null
  payment_method: PaymentMethod
  cashier_id: number
  subtotal: number
  discount_amount: number
  vat_amount: number
  total: number
  status: Sale['status']
}

interface SaleItemRow {
  id: number
  sale_id: number
  product_id: number
  description: string
  qty: number
  unit_price: number
  discount_amount: number
  vat_amount: number
  line_total: number
  is_exchange_item: number
}

function toSale(row: SaleRow): Sale {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    createdAt: row.created_at,
    customerId: row.customer_id,
    paymentMethod: row.payment_method,
    cashierId: row.cashier_id,
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    vatAmount: row.vat_amount,
    total: row.total,
    status: row.status
  }
}

function toSaleItem(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    description: row.description,
    qty: row.qty,
    unitPrice: row.unit_price,
    discountAmount: row.discount_amount,
    vatAmount: row.vat_amount,
    lineTotal: row.line_total,
    isExchangeItem: !!row.is_exchange_item
  }
}

export interface FinalizeSaleLine {
  productId: number
  description: string
  qty: number
  unitPrice: number
  discountAmount: number
  vatAmount: number
  lineTotal: number
  isExchangeItem: boolean
}

export interface FinalizeSaleParams {
  cashierId: number
  customerId: number | null
  paymentMethod: PaymentMethod
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
  items: FinalizeSaleLine[]
}

function nextInvoiceNo(db: Database.Database): string {
  const { seq } = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS seq FROM sales').get() as {
    seq: number
  }
  return `INV-${String(seq).padStart(6, '0')}`
}

function getSaleWithItems(db: Database.Database, saleId: number): SaleWithItems {
  const saleRow = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as SaleRow
  const itemRows = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId) as SaleItemRow[]
  return { ...toSale(saleRow), items: itemRows.map(toSaleItem) }
}

export function finalizeSale(params: FinalizeSaleParams): SaleWithItems {
  const db = getDb()
  const run = db.transaction((): SaleWithItems => {
    const invoiceNo = nextInvoiceNo(db)
    const saleResult = db
      .prepare(
        `INSERT INTO sales (
          invoice_no, customer_id, payment_method, cashier_id,
          subtotal, discount_amount, vat_amount, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')`
      )
      .run(
        invoiceNo,
        params.customerId,
        params.paymentMethod,
        params.cashierId,
        params.subtotal,
        params.discountAmount,
        params.vatAmount,
        params.total
      )
    const saleId = Number(saleResult.lastInsertRowid)

    const insertItem = db.prepare(
      `INSERT INTO sale_items (
        sale_id, product_id, description, qty, unit_price, discount_amount, vat_amount, line_total, is_exchange_item
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const item of params.items) {
      insertItem.run(
        saleId,
        item.productId,
        item.description,
        item.qty,
        item.unitPrice,
        item.discountAmount,
        item.vatAmount,
        item.lineTotal,
        item.isExchangeItem ? 1 : 0
      )
      if (!item.isExchangeItem) {
        decrementStock(item.productId, item.qty)
        recordStockMovement(
          {
            productId: item.productId,
            qtyDelta: -item.qty,
            movementType: 'sale',
            referenceTable: 'sales',
            referenceId: saleId
          },
          db
        )
      }
    }

    db.prepare('INSERT INTO payments (sale_id, method, amount) VALUES (?, ?, ?)').run(
      saleId,
      params.paymentMethod,
      params.total
    )

    recordAuditLog(
      {
        userId: params.cashierId,
        action: 'sales.create',
        tableName: 'sales',
        recordId: saleId,
        details: { invoiceNo, total: params.total }
      },
      db
    )

    return getSaleWithItems(db, saleId)
  })
  return run()
}

export function searchSales(filter: SalesHistoryFilter): Sale[] {
  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (filter.dateFrom) {
    clauses.push('date(s.created_at) >= date(?)')
    params.push(filter.dateFrom)
  }
  if (filter.dateTo) {
    clauses.push('date(s.created_at) <= date(?)')
    params.push(filter.dateTo)
  }
  if (filter.cashierId) {
    clauses.push('s.cashier_id = ?')
    params.push(filter.cashierId)
  }
  if (filter.paymentMethod) {
    clauses.push('s.payment_method = ?')
    params.push(filter.paymentMethod)
  }
  if (filter.productId) {
    clauses.push('EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id AND si.product_id = ?)')
    params.push(filter.productId)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(`SELECT s.* FROM sales s ${where} ORDER BY s.id DESC LIMIT 500`)
    .all(...params) as SaleRow[]
  return rows.map(toSale)
}

export function listSalesWithItemsInRange(dateFrom: string, dateTo: string): SaleWithItems[] {
  const db = getDb()
  const salesRows = db
    .prepare(
      `SELECT * FROM sales WHERE status != 'void' AND date(created_at) BETWEEN date(?) AND date(?) ORDER BY id`
    )
    .all(dateFrom, dateTo) as SaleRow[]
  return salesRows.map((row) => {
    const itemRows = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(row.id) as SaleItemRow[]
    return { ...toSale(row), items: itemRows.map(toSaleItem) }
  })
}

export function getMonthlySummary(): MonthlySalesSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT strftime('%Y-%m', created_at) AS month,
              COUNT(*) AS salesCount,
              COALESCE(SUM(subtotal), 0) AS subtotal,
              COALESCE(SUM(discount_amount), 0) AS discountAmount,
              COALESCE(SUM(vat_amount), 0) AS vatAmount,
              COALESCE(SUM(total), 0) AS total
       FROM sales
       WHERE status != 'void'
       GROUP BY month
       ORDER BY month DESC`
    )
    .all() as MonthlySalesSummary[]
  return rows.map((r) => ({
    month: r.month,
    salesCount: r.salesCount,
    subtotal: round2(r.subtotal),
    discountAmount: round2(r.discountAmount),
    vatAmount: round2(r.vatAmount),
    total: round2(r.total)
  }))
}

export function getVatSummary(dateFrom: string, dateTo: string): VatSummary {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS salesCount,
              COALESCE(SUM(subtotal - discount_amount), 0) AS taxableAmount,
              COALESCE(SUM(vat_amount), 0) AS vatAmount,
              COALESCE(SUM(total), 0) AS totalAmount
       FROM sales
       WHERE status != 'void' AND date(created_at) BETWEEN date(?) AND date(?)`
    )
    .get(dateFrom, dateTo) as {
    salesCount: number
    taxableAmount: number
    vatAmount: number
    totalAmount: number
  }
  return {
    dateFrom,
    dateTo,
    salesCount: row.salesCount,
    taxableAmount: round2(row.taxableAmount),
    vatAmount: round2(row.vatAmount),
    totalAmount: round2(row.totalAmount)
  }
}

export function getZReport(date: string): ZReport {
  const db = getDb()
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS salesCount,
              COALESCE(SUM(subtotal), 0) AS subtotal,
              COALESCE(SUM(discount_amount), 0) AS discountAmount,
              COALESCE(SUM(vat_amount), 0) AS vatAmount,
              COALESCE(SUM(total), 0) AS total
       FROM sales
       WHERE status != 'void' AND date(created_at) = date(?)`
    )
    .get(date) as {
    salesCount: number
    subtotal: number
    discountAmount: number
    vatAmount: number
    total: number
  }

  const byMethodRows = db
    .prepare(
      `SELECT payment_method AS method, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
       FROM sales
       WHERE status != 'void' AND date(created_at) = date(?)
       GROUP BY payment_method`
    )
    .all(date) as PaymentMethodBreakdown[]

  const expectedCash = byMethodRows.find((m) => m.method === 'cash')?.total ?? 0

  return {
    date,
    salesCount: totals.salesCount,
    subtotal: round2(totals.subtotal),
    discountAmount: round2(totals.discountAmount),
    vatAmount: round2(totals.vatAmount),
    total: round2(totals.total),
    byPaymentMethod: byMethodRows.map((m) => ({ method: m.method, count: m.count, total: round2(m.total) })),
    expectedCash: round2(expectedCash)
  }
}
