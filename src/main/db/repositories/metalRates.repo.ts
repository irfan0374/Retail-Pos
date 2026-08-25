import { getDb } from '../index'
import type { MetalRate } from '@shared/types/product'

interface MetalRateRow {
  id: number
  date: string
  metal_type: MetalRate['metalType']
  purity: string
  rate_per_gram: number
  created_by: number | null
  created_at: string
}

function toMetalRate(row: MetalRateRow): MetalRate {
  return {
    id: row.id,
    date: row.date,
    metalType: row.metal_type,
    purity: row.purity,
    ratePerGram: row.rate_per_gram,
    createdBy: row.created_by,
    createdAt: row.created_at
  }
}

/** The latest rate on record for each (metal_type, purity) pair. */
export function listLatestMetalRates(): MetalRate[] {
  const rows = getDb()
    .prepare(
      `SELECT r.* FROM metal_rates r
       INNER JOIN (
         SELECT metal_type, purity, MAX(date) AS max_date
         FROM metal_rates GROUP BY metal_type, purity
       ) latest ON latest.metal_type = r.metal_type AND latest.purity = r.purity AND latest.max_date = r.date
       ORDER BY r.metal_type, r.purity`
    )
    .all() as MetalRateRow[]
  return rows.map(toMetalRate)
}

export function upsertMetalRate(
  input: { date: string; metalType: MetalRate['metalType']; purity: string; ratePerGram: number },
  createdBy: number
): MetalRate {
  const db = getDb()
  db.prepare(
    `INSERT INTO metal_rates (date, metal_type, purity, rate_per_gram, created_by)
     VALUES (@date, @metalType, @purity, @ratePerGram, @createdBy)
     ON CONFLICT(date, metal_type, purity) DO UPDATE SET rate_per_gram = excluded.rate_per_gram, created_by = excluded.created_by`
  ).run({ ...input, createdBy })

  const row = db
    .prepare('SELECT * FROM metal_rates WHERE date = ? AND metal_type = ? AND purity = ?')
    .get(input.date, input.metalType, input.purity) as MetalRateRow
  return toMetalRate(row)
}
