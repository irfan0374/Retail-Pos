import { getDb } from '../index'
import type { NewProductInput, Product, UpdateProductInput } from '@shared/types/product'

interface ProductRow {
  id: number
  barcode: string
  sku: string | null
  name: string
  type: Product['type']
  category_id: number | null
  metal_type: Product['metalType']
  purity: string | null
  gross_weight: number | null
  net_weight: number | null
  stone_weight: number | null
  making_charge: number | null
  making_charge_type: Product['makingChargeType']
  wastage_pct: number | null
  is_rate_based: number
  hallmark_no: string | null
  cost_price: number
  selling_price: number
  stock_qty: number
  low_stock_threshold: number
  supplier_id: number | null
  is_active: number
  created_at: string
  updated_at: string
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    barcode: row.barcode,
    sku: row.sku,
    name: row.name,
    type: row.type,
    categoryId: row.category_id,
    metalType: row.metal_type,
    purity: row.purity,
    grossWeight: row.gross_weight,
    netWeight: row.net_weight,
    stoneWeight: row.stone_weight,
    makingCharge: row.making_charge,
    makingChargeType: row.making_charge_type,
    wastagePct: row.wastage_pct,
    isRateBased: !!row.is_rate_based,
    hallmarkNo: row.hallmark_no,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    stockQty: row.stock_qty,
    lowStockThreshold: row.low_stock_threshold,
    supplierId: row.supplier_id,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listProducts(filter?: { type?: Product['type']; activeOnly?: boolean }): Product[] {
  const clauses: string[] = []
  const params: unknown[] = []
  if (filter?.type) {
    clauses.push('type = ?')
    params.push(filter.type)
  }
  if (filter?.activeOnly) {
    clauses.push('is_active = 1')
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = getDb()
    .prepare(`SELECT * FROM products ${where} ORDER BY name`)
    .all(...params) as ProductRow[]
  return rows.map(toProduct)
}

export function searchProducts(query: string): Product[] {
  const like = `%${query}%`
  const rows = getDb()
    .prepare(
      `SELECT * FROM products
       WHERE is_active = 1 AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)
       ORDER BY name LIMIT 50`
    )
    .all(like, like, like) as ProductRow[]
  return rows.map(toProduct)
}

export function findProductByBarcode(barcode: string): Product | null {
  const row = getDb().prepare('SELECT * FROM products WHERE barcode = ?').get(barcode) as
    | ProductRow
    | undefined
  return row ? toProduct(row) : null
}

export function findProductById(id: number): Product | null {
  const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined
  return row ? toProduct(row) : null
}

function nextBarcode(): string {
  const db = getDb()
  const { seq } = db
    .prepare(`SELECT COALESCE(MAX(id), 0) + 1 AS seq FROM products`)
    .get() as { seq: number }
  return `RK${String(seq).padStart(8, '0')}`
}

export function createProduct(input: NewProductInput): Product {
  const db = getDb()
  const insert = db.transaction((): Product => {
    const barcode = nextBarcode()
    const result = db
      .prepare(
        `INSERT INTO products (
          barcode, sku, name, type, category_id,
          metal_type, purity, gross_weight, net_weight, stone_weight,
          making_charge, making_charge_type, wastage_pct, is_rate_based, hallmark_no,
          cost_price, selling_price, stock_qty, low_stock_threshold, supplier_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        barcode,
        input.sku,
        input.name,
        input.type,
        input.categoryId,
        input.metalType,
        input.purity,
        input.grossWeight,
        input.netWeight,
        input.stoneWeight,
        input.makingCharge,
        input.makingChargeType,
        input.wastagePct,
        input.isRateBased ? 1 : 0,
        input.hallmarkNo,
        input.costPrice,
        input.sellingPrice,
        input.stockQty,
        input.lowStockThreshold,
        input.supplierId
      )
    return findProductById(Number(result.lastInsertRowid))!
  })
  return insert()
}

export function updateProduct(input: UpdateProductInput): Product {
  const existing = findProductById(input.id)
  if (!existing) throw new Error(`Product ${input.id} not found`)

  const merged: NewProductInput = { ...existing, ...input }
  getDb()
    .prepare(
      `UPDATE products SET
        sku = ?, name = ?, type = ?, category_id = ?,
        metal_type = ?, purity = ?, gross_weight = ?, net_weight = ?, stone_weight = ?,
        making_charge = ?, making_charge_type = ?, wastage_pct = ?, is_rate_based = ?, hallmark_no = ?,
        cost_price = ?, selling_price = ?, stock_qty = ?, low_stock_threshold = ?, supplier_id = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    )
    .run(
      merged.sku,
      merged.name,
      merged.type,
      merged.categoryId,
      merged.metalType,
      merged.purity,
      merged.grossWeight,
      merged.netWeight,
      merged.stoneWeight,
      merged.makingCharge,
      merged.makingChargeType,
      merged.wastagePct,
      merged.isRateBased ? 1 : 0,
      merged.hallmarkNo,
      merged.costPrice,
      merged.sellingPrice,
      merged.stockQty,
      merged.lowStockThreshold,
      merged.supplierId,
      input.id
    )
  return findProductById(input.id)!
}

export function deactivateProduct(id: number): void {
  getDb().prepare(`UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(id)
}

export function decrementStock(productId: number, qty: number): void {
  getDb()
    .prepare(`UPDATE products SET stock_qty = stock_qty - ?, updated_at = datetime('now') WHERE id = ?`)
    .run(qty, productId)
}

export function incrementStock(productId: number, qty: number): void {
  getDb()
    .prepare(`UPDATE products SET stock_qty = stock_qty + ?, updated_at = datetime('now') WHERE id = ?`)
    .run(qty, productId)
}

/** Last-cost model: a purchase line's unit cost becomes the product's current cost price. */
export function updateCostPrice(productId: number, costPrice: number): void {
  getDb()
    .prepare(`UPDATE products SET cost_price = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(costPrice, productId)
}
