import { listLatestMetalRates } from '../db/repositories/metalRates.repo'
import { calculateJewelryUnitPrice, round2 } from '@shared/pricing'
import type { Product } from '@shared/types/product'

/**
 * Resolves what a product should sell for right now: the live-computed rate-based price for
 * `is_rate_based` jewelry, or the stored `selling_price` for everything else.
 */
export function resolveUnitPrice(product: Product): number {
  if (!product.isRateBased || product.type !== 'jewelry') {
    return product.sellingPrice
  }
  if (!product.metalType || !product.purity || !product.netWeight || !product.makingChargeType) {
    return product.sellingPrice
  }

  const rates = listLatestMetalRates()
  const rate = rates.find((r) => r.metalType === product.metalType && r.purity === product.purity)
  if (!rate) return product.sellingPrice

  const { unitPrice } = calculateJewelryUnitPrice({
    netWeightGrams: product.netWeight,
    ratePerGram: rate.ratePerGram,
    wastagePct: product.wastagePct ?? 0,
    makingCharge: product.makingCharge ?? 0,
    makingChargeType: product.makingChargeType
  })
  return round2(unitPrice)
}
