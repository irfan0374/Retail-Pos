import type Database from 'better-sqlite3'
import { getDb } from '../index'
import type { StockMovement, StockMovementType } from '@shared/types/purchase'

interface StockMovementRow {
  id: number
  product_id: number
  qty_delta: number
  movement_type: StockMovementType
  reference_table: string
  reference_id: number
  created_at: string
}

function toStockMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    qtyDelta: row.qty_delta,
    movementType: row.movement_type,
    referenceTable: row.reference_table,
    referenceId: row.reference_id,
    createdAt: row.created_at
  }
}

/**
 * Pass `db` explicitly when called inside another repository's transaction (e.g. sales.finalize,
 * purchases.createPurchase) so the movement row commits atomically with the stock change it
 * records; omit it for standalone calls.
 */
export function recordStockMovement(
  entry: {
    productId: number
    qtyDelta: number
    movementType: StockMovementType
    referenceTable: string
    referenceId: number
  },
  db: Database.Database = getDb()
): void {
  db.prepare(
    `INSERT INTO stock_movements (product_id, qty_delta, movement_type, reference_table, reference_id)
     VALUES (?, ?, ?, ?, ?)`
  ).run(entry.productId, entry.qtyDelta, entry.movementType, entry.referenceTable, entry.referenceId)
}

export function listStockMovements(filter?: { productId?: number }): StockMovement[] {
  const db = getDb()
  const rows = filter?.productId
    ? (db
        .prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY id DESC LIMIT 200')
        .all(filter.productId) as StockMovementRow[])
    : (db.prepare('SELECT * FROM stock_movements ORDER BY id DESC LIMIT 200').all() as StockMovementRow[])
  return rows.map(toStockMovement)
}
