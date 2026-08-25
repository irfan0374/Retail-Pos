import { getDb } from '../index'
import type { Customer, NewCustomerInput } from '@shared/types/customer'

interface CustomerRow {
  id: number
  name: string
  phone: string | null
  trn: string | null
  created_at: string
}

function toCustomer(row: CustomerRow): Customer {
  return { id: row.id, name: row.name, phone: row.phone, trn: row.trn, createdAt: row.created_at }
}

export function searchCustomers(query: string): Customer[] {
  const like = `%${query}%`
  const rows = getDb()
    .prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name LIMIT 20')
    .all(like, like) as CustomerRow[]
  return rows.map(toCustomer)
}

export function createCustomer(input: NewCustomerInput): Customer {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO customers (name, phone, trn) VALUES (?, ?, ?)')
    .run(input.name, input.phone, input.trn)
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as CustomerRow
  return toCustomer(row)
}

export function findCustomerById(id: number): Customer | null {
  const row = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow | undefined
  return row ? toCustomer(row) : null
}
