import { getDb } from '../index'
import { findProductById } from './products.repo'
import type { HeldSale, HeldSaleItem, HeldSaleWithItems, NewHeldSaleInput } from '@shared/types/heldSale'

interface HeldSaleRow {
  id: number
  cashier_id: number
  note: string | null
  bill_discount_amount: number
  created_at: string
}

interface HeldSaleItemRow {
  id: number
  held_sale_id: number
  product_id: number
  description: string
  qty: number
  unit_price: number
  discount_amount: number
  is_exchange_item: number
}

function toHeldSale(row: HeldSaleRow): HeldSale {
  return {
    id: row.id,
    cashierId: row.cashier_id,
    note: row.note,
    billDiscountAmount: row.bill_discount_amount,
    createdAt: row.created_at
  }
}

function toHeldSaleItem(row: HeldSaleItemRow): HeldSaleItem | null {
  const product = findProductById(row.product_id)
  if (!product) return null
  return {
    id: row.id,
    heldSaleId: row.held_sale_id,
    product,
    description: row.description,
    qty: row.qty,
    unitPrice: row.unit_price,
    discountAmount: row.discount_amount,
    isExchangeItem: !!row.is_exchange_item
  }
}

export function listHeldSales(): HeldSale[] {
  const rows = getDb().prepare('SELECT * FROM held_sales ORDER BY id DESC').all() as HeldSaleRow[]
  return rows.map(toHeldSale)
}

export function getHeldSaleWithItems(id: number): HeldSaleWithItems | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM held_sales WHERE id = ?').get(id) as HeldSaleRow | undefined
  if (!row) return null
  const itemRows = db.prepare('SELECT * FROM held_sale_items WHERE held_sale_id = ?').all(id) as HeldSaleItemRow[]
  const items = itemRows.map(toHeldSaleItem).filter((item): item is HeldSaleItem => item !== null)
  return { ...toHeldSale(row), items }
}

export function createHeldSale(input: NewHeldSaleInput, cashierId: number): HeldSale {
  const db = getDb()
  const run = db.transaction((): HeldSale => {
    const result = db
      .prepare('INSERT INTO held_sales (cashier_id, note, bill_discount_amount) VALUES (?, ?, ?)')
      .run(cashierId, input.note, input.billDiscountAmount)
    const heldSaleId = Number(result.lastInsertRowid)

    const insertItem = db.prepare(
      `INSERT INTO held_sale_items (held_sale_id, product_id, description, qty, unit_price, discount_amount, is_exchange_item)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const item of input.items) {
      insertItem.run(
        heldSaleId,
        item.productId,
        item.description,
        item.qty,
        item.unitPrice,
        item.discountAmount,
        item.isExchangeItem ? 1 : 0
      )
    }

    const row = db.prepare('SELECT * FROM held_sales WHERE id = ?').get(heldSaleId) as HeldSaleRow
    return toHeldSale(row)
  })
  return run()
}

export function deleteHeldSale(id: number): void {
  const db = getDb()
  const run = db.transaction(() => {
    db.prepare('DELETE FROM held_sale_items WHERE held_sale_id = ?').run(id)
    db.prepare('DELETE FROM held_sales WHERE id = ?').run(id)
  })
  run()
}
