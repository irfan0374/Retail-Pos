import { getDb } from '../index'
import { round2 } from '@shared/pricing'
import { EXCHANGE_PLACEHOLDER_SKU } from '@shared/constants'
import type { DashboardSummary, SlowMovingProduct, TopSellingProduct } from '@shared/types/report'

/** `created_at` is UTC; "this month" means the shop's local calendar month. */
const THIS_MONTH = (column: string): string =>
  `strftime('%Y-%m', ${column}, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`

export function getDashboardSummary(): DashboardSummary {
  const db = getDb()

  const { revenueToday } = db
    .prepare(
      `SELECT
         (SELECT COALESCE(SUM(total), 0) FROM sales
          WHERE status != 'void' AND date(created_at, 'localtime') = date('now', 'localtime'))
         - (SELECT COALESCE(SUM(total), 0) FROM credit_notes
            WHERE date(created_at, 'localtime') = date('now', 'localtime')) AS revenueToday`
    )
    .get() as { revenueToday: number }

  const { revenueThisMonth } = db
    .prepare(
      `SELECT
         (SELECT COALESCE(SUM(total), 0) FROM sales
          WHERE status != 'void' AND ${THIS_MONTH('created_at')})
         - (SELECT COALESCE(SUM(total), 0) FROM credit_notes WHERE ${THIS_MONTH('created_at')}) AS revenueThisMonth`
    )
    .get() as { revenueThisMonth: number }

  // Margin uses each line's product's *current* cost price — sale_items doesn't snapshot cost,
  // so this is an approximation, not the exact margin at the time of sale.
  const { lineRevenue, lineCost } = db
    .prepare(
      `SELECT
         COALESCE(SUM(si.qty * si.unit_price), 0) AS lineRevenue,
         COALESCE(SUM(si.qty * p.cost_price), 0) AS lineCost
       FROM sale_items si
       INNER JOIN sales s ON s.id = si.sale_id
       INNER JOIN products p ON p.id = si.product_id
       WHERE s.status != 'void' AND si.is_exchange_item = 0
         AND ${THIS_MONTH('s.created_at')}`
    )
    .get() as { lineRevenue: number; lineCost: number }

  const marginThisMonthPct = lineRevenue > 0 ? round2(((lineRevenue - lineCost) / lineRevenue) * 100) : 0

  return {
    revenueToday: round2(revenueToday),
    revenueThisMonth: round2(revenueThisMonth),
    marginThisMonthPct
  }
}

export function getTopSellingProducts(limit = 10): TopSellingProduct[] {
  const rows = getDb()
    .prepare(
      `SELECT
         p.id AS productId,
         p.name AS productName,
         SUM(si.qty) AS qtySold,
         SUM(si.line_total) AS revenue
       FROM sale_items si
       INNER JOIN sales s ON s.id = si.sale_id
       INNER JOIN products p ON p.id = si.product_id
       WHERE s.status != 'void' AND si.is_exchange_item = 0
         AND ${THIS_MONTH('s.created_at')}
       GROUP BY p.id
       ORDER BY qtySold DESC
       LIMIT ?`
    )
    .all(limit) as TopSellingProduct[]
  return rows.map((r) => ({ ...r, revenue: round2(r.revenue) }))
}

export function getSlowMovingProducts(limit = 10): SlowMovingProduct[] {
  const rows = getDb()
    .prepare(
      `SELECT
         p.id AS productId,
         p.name AS productName,
         p.stock_qty AS stockQty,
         MAX(s.created_at) AS lastSoldAt
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id AND si.is_exchange_item = 0
       LEFT JOIN sales s ON s.id = si.sale_id AND s.status != 'void'
       WHERE p.is_active = 1 AND p.sku IS NOT ?
       GROUP BY p.id
       ORDER BY (lastSoldAt IS NOT NULL) ASC, lastSoldAt ASC
       LIMIT ?`
    )
    .all(EXCHANGE_PLACEHOLDER_SKU, limit) as SlowMovingProduct[]
  return rows
}
