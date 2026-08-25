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

/**
 * Credits back a proportional slice of what was actually charged on each original sale line
 * (never recomputed from current prices/rates) — the same "never mutate history" principle as
 * purchase returns. Increments stock for the returned qty and writes a `sale_return` movement.
 */
export function createCreditNote(input: NewCreditNoteInput, createdBy: number): CreditNoteWithItems {
  const db = getDb()
  const run = db.transaction((): CreditNoteWithItems => {
    let subtotal = 0
    let vatTotal = 0
    const lines: {
      saleItemId: number
      productId: number
      qty: number
      unitPrice: number
      vatAmount: number
      lineTotal: number
      isExchangeItem: boolean
    }[] = []

    for (const item of input.items) {
      const saleItem = findSaleItemById(item.saleItemId)
      if (!saleItem || saleItem.saleId !== input.saleId) {
        throw new Error(`Sale item ${item.saleItemId} does not belong to sale ${input.saleId}`)
      }
      if (item.qty <= 0 || item.qty > saleItem.qty) {
        throw new Error(`Invalid return quantity for sale item ${item.saleItemId}`)
      }
      const fraction = item.qty / saleItem.qty
      const vatAmount = round2(saleItem.vatAmount * fraction)
      const lineTotal = round2(saleItem.lineTotal * fraction)
      subtotal = round2(subtotal + round2(saleItem.unitPrice * item.qty))
      vatTotal = round2(vatTotal + vatAmount)
      lines.push({
        saleItemId: item.saleItemId,
        productId: saleItem.productId,
        qty: item.qty,
        unitPrice: saleItem.unitPrice,
        vatAmount,
        lineTotal,
        isExchangeItem: saleItem.isExchangeItem
      })
    }

    const creditNoteNo = nextCreditNoteNo(db)
    const total = round2(subtotal + vatTotal)
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
      if (!line.isExchangeItem) {
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
