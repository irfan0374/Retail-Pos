import { calculateJewelryUnitPrice } from '@shared/pricing'
import type { MetalRate, Product } from '@shared/types/product'

/**
 * Mirrors the main process's pricing.service resolution purely for live UI preview —
 * the server independently recomputes this from its own data at finalize time, so this
 * value is never trusted, only displayed.
 */
export function resolveDisplayUnitPrice(product: Product, rates: MetalRate[]): number {
  if (!product.isRateBased || product.type !== 'jewelry') return product.sellingPrice
  if (!product.metalType || !product.purity || !product.netWeight || !product.makingChargeType) {
    return product.sellingPrice
  }
  const rate = rates.find((r) => r.metalType === product.metalType && r.purity === product.purity)
  if (!rate) return product.sellingPrice

  return calculateJewelryUnitPrice({
    netWeightGrams: product.netWeight,
    ratePerGram: rate.ratePerGram,
    wastagePct: product.wastagePct ?? 0,
    makingCharge: product.makingCharge ?? 0,
    makingChargeType: product.makingChargeType
  }).unitPrice
}
