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
