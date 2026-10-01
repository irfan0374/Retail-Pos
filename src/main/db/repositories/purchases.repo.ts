import type Database from 'better-sqlite3'
import { getDb } from '../index'
import { incrementStock, decrementStock, updateCostPrice } from './products.repo'
import { recordAuditLog } from './auditLog.repo'
import { recordStockMovement } from './stockMovements.repo'
import { round2 } from '@shared/pricing'
import type {
  NewPurchaseInput,
  NewPurchaseReturnInput,
  Purchase,
  PurchaseItem,
  PurchaseReturn,
  PurchaseReturnItem,
  PurchaseReturnWithItems,
  PurchaseWithItems
} from '@shared/types/purchase'

interface PurchaseRow {
  id: number
  supplier_id: number
  invoice_ref: string | null
  date: string
  subtotal: number
  total: number
  created_by: number | null
  created_at: string
}

interface PurchaseItemRow {
  id: number
  purchase_id: number
  product_id: number
  qty: number
  unit_cost: number
  line_total: number
}

interface PurchaseReturnRow {
  id: number
  purchase_id: number
  reason: string | null
  total: number
  created_by: number | null
  created_at: string
}

interface PurchaseReturnItemRow {
  id: number
  purchase_return_id: number
  purchase_item_id: number
  product_id: number
  qty: number
  unit_cost: number
  line_total: number
}

function toPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    invoiceRef: row.invoice_ref,
    date: row.date,
    subtotal: row.subtotal,
    total: row.total,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

function toPurchaseItem(row: PurchaseItemRow): PurchaseItem {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    qty: row.qty,
    unitCost: row.unit_cost,
    lineTotal: row.line_total
  }
}

function toPurchaseReturn(row: PurchaseReturnRow): PurchaseReturn {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    reason: row.reason,
    total: row.total,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

function toPurchaseReturnItem(row: PurchaseReturnItemRow): PurchaseReturnItem {
  return {
    id: row.id,
    purchaseReturnId: row.purchase_return_id,
    purchaseItemId: row.purchase_item_id,
    productId: row.product_id,
    qty: row.qty,
    unitCost: row.unit_cost,
    lineTotal: row.line_total
  }
}

export function listPurchases(filter?: { supplierId?: number }): Purchase[] {
  const db = getDb()
  const rows = filter?.supplierId
    ? (db
        .prepare('SELECT * FROM purchases WHERE supplier_id = ? ORDER BY id DESC')
        .all(filter.supplierId) as PurchaseRow[])
    : (db.prepare('SELECT * FROM purchases ORDER BY id DESC').all() as PurchaseRow[])
  return rows.map(toPurchase)
}

export function listPurchasesWithItemsInRange(dateFrom: string, dateTo: string): PurchaseWithItems[] {
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM purchases WHERE date(date, 'localtime') BETWEEN date(?) AND date(?) ORDER BY id")
    .all(dateFrom, dateTo) as PurchaseRow[]
  return rows.map((row) => {
    const itemRows = db
      .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
      .all(row.id) as PurchaseItemRow[]
    return { ...toPurchase(row), items: itemRows.map(toPurchaseItem) }
  })
}

export function getPurchaseWithItems(id: number): PurchaseWithItems | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as PurchaseRow | undefined
  if (!row) return null
  const itemRows = db
    .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
    .all(id) as PurchaseItemRow[]
  return { ...toPurchase(row), items: itemRows.map(toPurchaseItem) }
}

export function createPurchase(input: NewPurchaseInput, createdBy: number): PurchaseWithItems {
  const db = getDb()
  const run = db.transaction((): PurchaseWithItems => {
    const subtotal = round2(input.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0))

    const purchaseResult = db
      .prepare(
        `INSERT INTO purchases (supplier_id, invoice_ref, subtotal, total, created_by)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(input.supplierId, input.invoiceRef, subtotal, subtotal, createdBy)
    const purchaseId = Number(purchaseResult.lastInsertRowid)

    const insertItem = db.prepare(
      `INSERT INTO purchase_items (purchase_id, product_id, qty, unit_cost, line_total)
       VALUES (?, ?, ?, ?, ?)`
    )
    for (const item of input.items) {
      const lineTotal = round2(item.qty * item.unitCost)
      insertItem.run(purchaseId, item.productId, item.qty, item.unitCost, lineTotal)
      incrementStock(item.productId, item.qty)
      updateCostPrice(item.productId, item.unitCost)
      recordStockMovement(
        {
          productId: item.productId,
          qtyDelta: item.qty,
          movementType: 'purchase',
          referenceTable: 'purchases',
          referenceId: purchaseId
        },
        db
      )
    }

    recordAuditLog(
      {
        userId: createdBy,
        action: 'purchases.create',
        tableName: 'purchases',
        recordId: purchaseId,
        details: { supplierId: input.supplierId, total: subtotal }
      },
      db
    )

    return getPurchaseWithItemsInTx(db, purchaseId)
  })
  return run()
}

function getPurchaseWithItemsInTx(db: Database.Database, purchaseId: number): PurchaseWithItems {
  const row = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId) as PurchaseRow
  const itemRows = db
    .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
    .all(purchaseId) as PurchaseItemRow[]
  return { ...toPurchase(row), items: itemRows.map(toPurchaseItem) }
}

export function listPurchaseReturns(filter?: { purchaseId?: number }): PurchaseReturn[] {
  const db = getDb()
  const rows = filter?.purchaseId
    ? (db
        .prepare('SELECT * FROM purchase_returns WHERE purchase_id = ? ORDER BY id DESC')
        .all(filter.purchaseId) as PurchaseReturnRow[])
    : (db.prepare('SELECT * FROM purchase_returns ORDER BY id DESC').all() as PurchaseReturnRow[])
  return rows.map(toPurchaseReturn)
}

/** Quantities are REAL, so compare at the 0.001 precision the UI allows. */
const QTY_EPSILON = 0.0005

export function createPurchaseReturn(
  input: NewPurchaseReturnInput,
  createdBy: number
): PurchaseReturnWithItems {
  const db = getDb()
  const run = db.transaction((): PurchaseReturnWithItems => {
    // Merge repeated lines in one request so they can't each pass the remaining-qty check.
    const requested = new Map<number, number>()
    for (const item of input.items) {
      requested.set(item.purchaseItemId, (requested.get(item.purchaseItemId) ?? 0) + item.qty)
    }

    const findItem = db.prepare('SELECT * FROM purchase_items WHERE id = ?')
    const alreadyReturned = db.prepare(
      'SELECT COALESCE(SUM(qty), 0) AS qty FROM purchase_return_items WHERE purchase_item_id = ?'
    )

    // Product and cost always come from the original purchase line — never from the caller.
    const lines = [...requested].map(([purchaseItemId, qty]) => {
      const purchaseItem = findItem.get(purchaseItemId) as PurchaseItemRow | undefined
      if (!purchaseItem || purchaseItem.purchase_id !== input.purchaseId) {
        throw new Error(`Purchase item ${purchaseItemId} does not belong to purchase ${input.purchaseId}`)
      }
      const { qty: returnedQty } = alreadyReturned.get(purchaseItemId) as { qty: number }
      const remainingQty = purchaseItem.qty - returnedQty
      if (qty <= 0 || qty > remainingQty + QTY_EPSILON) {
        throw new Error(
          `Invalid return quantity for purchase item ${purchaseItemId} — ${round2(Math.max(remainingQty, 0))} left to return`
        )
      }
      return {
        purchaseItemId,
        productId: purchaseItem.product_id,
        qty,
        unitCost: purchaseItem.unit_cost,
        lineTotal: round2(qty * purchaseItem.unit_cost)
      }
    })
    const total = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0))

    const returnResult = db
      .prepare('INSERT INTO purchase_returns (purchase_id, reason, total, created_by) VALUES (?, ?, ?, ?)')
      .run(input.purchaseId, input.reason, total, createdBy)
    const returnId = Number(returnResult.lastInsertRowid)

    const insertItem = db.prepare(
      `INSERT INTO purchase_return_items (purchase_return_id, purchase_item_id, product_id, qty, unit_cost, line_total)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    for (const line of lines) {
      insertItem.run(returnId, line.purchaseItemId, line.productId, line.qty, line.unitCost, line.lineTotal)
      decrementStock(line.productId, line.qty)
      recordStockMovement(
        {
          productId: line.productId,
          qtyDelta: -line.qty,
          movementType: 'purchase_return',
          referenceTable: 'purchase_returns',
          referenceId: returnId
        },
        db
      )
    }

    recordAuditLog(
      {
        userId: createdBy,
        action: 'purchaseReturns.create',
        tableName: 'purchase_returns',
        recordId: returnId,
        details: { purchaseId: input.purchaseId, total }
      },
      db
    )

    const returnRow = db.prepare('SELECT * FROM purchase_returns WHERE id = ?').get(returnId) as PurchaseReturnRow
    const itemRows = db
      .prepare('SELECT * FROM purchase_return_items WHERE purchase_return_id = ?')
      .all(returnId) as PurchaseReturnItemRow[]
    return { ...toPurchaseReturn(returnRow), items: itemRows.map(toPurchaseReturnItem) }
  })
  return run()
}
