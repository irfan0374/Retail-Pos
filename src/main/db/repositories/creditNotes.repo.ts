import type Database from 'better-sqlite3'
import { getDb } from '../index'
import { findSaleItemById } from './sales.repo'
import { incrementStock } from './products.repo'
import { recordStockMovement } from './stockMovements.repo'
import { recordAuditLog } from './auditLog.repo'
import { round2 } from '@shared/pricing'
import type { CreditNote, CreditNoteItem, CreditNoteWithItems, NewCreditNoteInput } from '@shared/types/creditNote'

interface CreditNoteRow {
  id: number
  credit_note_no: string
  sale_id: number
  reason: string | null
  subtotal: number
  vat_amount: number
  total: number
  created_by: number | null
  created_at: string
}

interface CreditNoteItemRow {
  id: number
  credit_note_id: number
  sale_item_id: number
  product_id: number
  qty: number
  unit_price: number
  vat_amount: number
  line_total: number
}

function toCreditNote(row: CreditNoteRow): CreditNote {
  return {
    id: row.id,
    creditNoteNo: row.credit_note_no,
    saleId: row.sale_id,
    reason: row.reason,
    subtotal: row.subtotal,
    vatAmount: row.vat_amount,
    total: row.total,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

function toCreditNoteItem(row: CreditNoteItemRow): CreditNoteItem {
  return {
    id: row.id,
    creditNoteId: row.credit_note_id,
    saleItemId: row.sale_item_id,
    productId: row.product_id,
    qty: row.qty,
    unitPrice: row.unit_price,
    vatAmount: row.vat_amount,
    lineTotal: row.line_total
  }
}

function nextCreditNoteNo(db: Database.Database): string {
  const { seq } = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS seq FROM credit_notes').get() as {
    seq: number
  }
  return `CN-${String(seq).padStart(6, '0')}`
}

export function listCreditNotes(filter?: { saleId?: number }): CreditNote[] {
  const db = getDb()
  const rows = filter?.saleId
    ? (db
        .prepare('SELECT * FROM credit_notes WHERE sale_id = ? ORDER BY id DESC')
        .all(filter.saleId) as CreditNoteRow[])
    : (db.prepare('SELECT * FROM credit_notes ORDER BY id DESC').all() as CreditNoteRow[])
  return rows.map(toCreditNote)
}

/** Quantities are REAL (weighed items), so compare at the 0.001 precision the UI allows. */
const QTY_EPSILON = 0.0005

/**
 * Credits back a proportional slice of what was actually charged on each original sale line
 * (never recomputed from current prices/rates) — the same "never mutate history" principle as
 * purchase returns. Increments stock for the returned qty and writes a `sale_return` movement.
 *
 * Amounts are computed cumulatively per sale line (everything credited so far, including this
 * return, minus what earlier credit notes already credited), so a line returned in several parts
 * credits exactly its original line total with no rounding drift.
 */
export function createCreditNote(input: NewCreditNoteInput, createdBy: number): CreditNoteWithItems {
  const db = getDb()
  const run = db.transaction((): CreditNoteWithItems => {
    const sale = db.prepare('SELECT status FROM sales WHERE id = ?').get(input.saleId) as
      | { status: string }
      | undefined
    if (!sale) throw new Error(`Sale ${input.saleId} not found`)
    if (sale.status === 'void') throw new Error('Cannot return items from a voided sale')

    // Merge repeated sale items in one request so they can't each pass the remaining-qty check.
    const requested = new Map<number, number>()
    for (const item of input.items) {
      requested.set(item.saleItemId, (requested.get(item.saleItemId) ?? 0) + item.qty)
    }

    const alreadyCredited = db.prepare(
      `SELECT COALESCE(SUM(qty), 0) AS qty, COALESCE(SUM(vat_amount), 0) AS vat, COALESCE(SUM(line_total), 0) AS total
       FROM credit_note_items WHERE sale_item_id = ?`
    )

    let subtotal = 0
    let vatTotal = 0
    let total = 0
    const lines: {
      saleItemId: number
      productId: number
      qty: number
      unitPrice: number
      vatAmount: number
      lineTotal: number
    }[] = []

    for (const [saleItemId, qty] of requested) {
      const saleItem = findSaleItemById(saleItemId)
      if (!saleItem || saleItem.saleId !== input.saleId) {
        throw new Error(`Sale item ${saleItemId} does not belong to sale ${input.saleId}`)
      }
      if (saleItem.isExchangeItem) {
        throw new Error('Old-gold exchange credit lines cannot be returned')
      }
      const prior = alreadyCredited.get(saleItemId) as { qty: number; vat: number; total: number }
      const remainingQty = saleItem.qty - prior.qty
      if (qty <= 0 || qty > remainingQty + QTY_EPSILON) {
        throw new Error(
          `Invalid return quantity for "${saleItem.description}" — ${round2(Math.max(remainingQty, 0))} left to return`
        )
      }

      const cumulativeFraction = Math.min((prior.qty + qty) / saleItem.qty, 1)
      const vatAmount = round2(round2(saleItem.vatAmount * cumulativeFraction) - prior.vat)
      const lineTotal = round2(round2(saleItem.lineTotal * cumulativeFraction) - prior.total)
      subtotal = round2(subtotal + lineTotal - vatAmount)
      vatTotal = round2(vatTotal + vatAmount)
      total = round2(total + lineTotal)
      lines.push({
        saleItemId,
        productId: saleItem.productId,
        qty,
        unitPrice: saleItem.unitPrice,
        vatAmount,
        lineTotal
      })
    }

    const creditNoteNo = nextCreditNoteNo(db)
    const result = db
      .prepare(
        `INSERT INTO credit_notes (credit_note_no, sale_id, reason, subtotal, vat_amount, total, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(creditNoteNo, input.saleId, input.reason, subtotal, vatTotal, total, createdBy)
    const creditNoteId = Number(result.lastInsertRowid)

    const insertItem = db.prepare(
      `INSERT INTO credit_note_items (credit_note_id, sale_item_id, product_id, qty, unit_price, vat_amount, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const line of lines) {
      insertItem.run(creditNoteId, line.saleItemId, line.productId, line.qty, line.unitPrice, line.vatAmount, line.lineTotal)
      incrementStock(line.productId, line.qty)
      recordStockMovement(
        {
          productId: line.productId,
          qtyDelta: line.qty,
          movementType: 'sale_return',
          referenceTable: 'credit_notes',
          referenceId: creditNoteId
        },
        db
      )
    }

    recordAuditLog(
      {
        userId: createdBy,
        action: 'creditNotes.create',
        tableName: 'credit_notes',
        recordId: creditNoteId,
        details: { saleId: input.saleId, total }
      },
      db
    )

    const row = db.prepare('SELECT * FROM credit_notes WHERE id = ?').get(creditNoteId) as CreditNoteRow
    const itemRows = db
      .prepare('SELECT * FROM credit_note_items WHERE credit_note_id = ?')
      .all(creditNoteId) as CreditNoteItemRow[]
    return { ...toCreditNote(row), items: itemRows.map(toCreditNoteItem) }
  })
  return run()
}
