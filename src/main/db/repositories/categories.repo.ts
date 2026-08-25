import { getDb } from '../index'
import type { Category } from '@shared/types/product'

interface CategoryRow {
  id: number
  name: string
  applies_to: Category['appliesTo']
}

function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, appliesTo: row.applies_to }
}

export function listCategories(): Category[] {
  const rows = getDb().prepare('SELECT * FROM categories ORDER BY name').all() as CategoryRow[]
  return rows.map(toCategory)
}

export function createCategory(input: { name: string; appliesTo: Category['appliesTo'] }): Category {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO categories (name, applies_to) VALUES (?, ?)')
    .run(input.name, input.appliesTo)
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as CategoryRow
  return toCategory(row)
}

export function updateCategory(input: { id: number; name: string; appliesTo: Category['appliesTo'] }): Category {
  const db = getDb()
  db.prepare('UPDATE categories SET name = ?, applies_to = ? WHERE id = ?').run(
    input.name,
    input.appliesTo,
    input.id
  )
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(input.id) as CategoryRow
  return toCategory(row)
}
