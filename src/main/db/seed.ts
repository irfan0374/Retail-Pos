import type Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { createProduct, deactivateProduct } from './repositories/products.repo'
import { EXCHANGE_PLACEHOLDER_SKU } from '@shared/constants'

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PIN = '1234'

/**
 * First-run only: creates a default admin so there's a way to log in before anyone else exists.
 * Logged to console (not audit_log, since there's no logged-in user yet) so it's visible on first boot.
 */
export function seedDefaultAdminIfEmpty(db: Database.Database): void {
  const userCount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n
  if (userCount > 0) return

  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PIN, 10)
  db.prepare(
    `INSERT INTO users (name, username, password_hash, role) VALUES (?, ?, ?, 'admin')`
  ).run('Administrator', DEFAULT_ADMIN_USERNAME, passwordHash)

  console.log(`[seed] Created default admin user — PIN: "${DEFAULT_ADMIN_PIN}". Change this after first login.`)
}

/** Ensures the singleton app_settings row (id=1) always exists so reads never need a null check. */
export function seedAppSettingsIfEmpty(db: Database.Database): void {
  const row = db.prepare('SELECT id FROM app_settings WHERE id = 1').get()
  if (row) return
  db.prepare(`INSERT INTO app_settings (id, shop_name, trn) VALUES (1, '', '')`).run()
}

/**
 * Old-gold exchange lines are a monetary credit, not a real catalog item — but sale_items still
 * needs a product to reference. This is that anchor: deactivated immediately so it never shows up
 * in search or checkout scanning.
 */
export function seedExchangePlaceholderProductIfMissing(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(EXCHANGE_PLACEHOLDER_SKU)
  if (existing) return

  const product = createProduct({
    sku: EXCHANGE_PLACEHOLDER_SKU,
    name: 'Old Gold / Metal Exchange',
    type: 'jewelry',
    categoryId: null,
    metalType: null,
    purity: null,
    grossWeight: null,
    netWeight: null,
    stoneWeight: null,
    makingCharge: null,
    makingChargeType: null,
    wastagePct: null,
    isRateBased: false,
    hallmarkNo: null,
    costPrice: 0,
    sellingPrice: 0,
    stockQty: 0,
    lowStockThreshold: 0,
    supplierId: null
  })
  deactivateProduct(product.id)
}
