import { getDb } from '../index'
import type {
  NewSupplierInput,
  NewSupplierPaymentInput,
  Supplier,
  SupplierLedger,
  SupplierPayment,
  UpdateSupplierInput
} from '@shared/types/supplier'

interface SupplierRow {
  id: number
  name: string
  phone: string | null
  address: string | null
}

interface SupplierPaymentRow {
  id: number
  supplier_id: number
  amount: number
  method: string | null
  note: string | null
  created_by: number | null
  created_at: string
}

function toSupplier(row: SupplierRow): Supplier {
  return { id: row.id, name: row.name, phone: row.phone, address: row.address }
}

function toSupplierPayment(row: SupplierPaymentRow): SupplierPayment {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    amount: row.amount,
    method: row.method,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

export function listSuppliers(): Supplier[] {
  const rows = getDb().prepare('SELECT * FROM suppliers ORDER BY name').all() as SupplierRow[]
  return rows.map(toSupplier)
}

export function searchSuppliers(query: string): Supplier[] {
  const like = `%${query}%`
  const rows = getDb()
    .prepare('SELECT * FROM suppliers WHERE name LIKE ? OR phone LIKE ? ORDER BY name LIMIT 20')
    .all(like, like) as SupplierRow[]
  return rows.map(toSupplier)
}

export function findSupplierById(id: number): Supplier | null {
  const row = getDb().prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as SupplierRow | undefined
  return row ? toSupplier(row) : null
}

export function createSupplier(input: NewSupplierInput): Supplier {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)')
    .run(input.name, input.phone, input.address)
  return findSupplierById(Number(result.lastInsertRowid))!
}

export function updateSupplier(input: UpdateSupplierInput): Supplier {
  getDb()
    .prepare('UPDATE suppliers SET name = ?, phone = ?, address = ? WHERE id = ?')
    .run(input.name, input.phone, input.address, input.id)
  return findSupplierById(input.id)!
}

export function createSupplierPayment(
  input: NewSupplierPaymentInput,
  createdBy: number
): SupplierPayment {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO supplier_payments (supplier_id, amount, method, note, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(input.supplierId, input.amount, input.method, input.note, createdBy)
  const row = db
    .prepare('SELECT * FROM supplier_payments WHERE id = ?')
    .get(result.lastInsertRowid) as SupplierPaymentRow
  return toSupplierPayment(row)
}

export function listSupplierPayments(supplierId: number): SupplierPayment[] {
  const rows = getDb()
    .prepare('SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY id DESC')
    .all(supplierId) as SupplierPaymentRow[]
  return rows.map(toSupplierPayment)
}

export function getSupplierLedger(supplierId: number): SupplierLedger {
  const db = getDb()
  const { totalPurchased } = db
    .prepare('SELECT COALESCE(SUM(total), 0) AS totalPurchased FROM purchases WHERE supplier_id = ?')
    .get(supplierId) as { totalPurchased: number }
  const { totalReturned } = db
    .prepare(
      `SELECT COALESCE(SUM(pr.total), 0) AS totalReturned
       FROM purchase_returns pr
       INNER JOIN purchases p ON p.id = pr.purchase_id
       WHERE p.supplier_id = ?`
    )
    .get(supplierId) as { totalReturned: number }
  const { totalPaid } = db
    .prepare('SELECT COALESCE(SUM(amount), 0) AS totalPaid FROM supplier_payments WHERE supplier_id = ?')
    .get(supplierId) as { totalPaid: number }

  return {
    supplierId,
    totalPurchased,
    totalReturned,
    totalPaid,
    balanceOwed: totalPurchased - totalReturned - totalPaid
  }
}
