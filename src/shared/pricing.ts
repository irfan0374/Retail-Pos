import { VAT_RATE } from './constants'

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export interface JewelryPricingInput {
  netWeightGrams: number
  ratePerGram: number
  wastagePct: number
  makingCharge: number
  makingChargeType: 'fixed' | 'percent'
}

export interface JewelryPricingResult {
  metalValue: number
  wastageValue: number
  makingChargeValue: number
  unitPrice: number
}

export function calculateJewelryUnitPrice(input: JewelryPricingInput): JewelryPricingResult {
  const metalValue = input.netWeightGrams * input.ratePerGram
  const wastageValue = metalValue * (input.wastagePct / 100)
  const makingChargeValue =
    input.makingChargeType === 'fixed' ? input.makingCharge : metalValue * (input.makingCharge / 100)
  return {
    metalValue: round2(metalValue),
    wastageValue: round2(wastageValue),
    makingChargeValue: round2(makingChargeValue),
    unitPrice: round2(metalValue + wastageValue + makingChargeValue)
  }
}

/** VAT is a flat 5% on the post-discount taxable line amount, for both jewelry and gift items. */
export function calculateLineVat(taxableAmount: number): number {
  return round2(taxableAmount * VAT_RATE)
}

export interface LineTotals {
  taxableAmount: number
  vatAmount: number
  lineTotal: number
}

export function calculateLineTotals(unitPrice: number, qty: number, discountAmount: number): LineTotals {
  const taxableAmount = round2(unitPrice * qty - discountAmount)
  const vatAmount = calculateLineVat(taxableAmount)
  return { taxableAmount, vatAmount, lineTotal: round2(taxableAmount + vatAmount) }
}

/** The effective discount % an edited unit price represents vs. the product's stored selling price. */
export function impliedDiscountPct(sellingPrice: number, editedUnitPrice: number): number {
  if (sellingPrice <= 0) return 0
  const pct = ((sellingPrice - editedUnitPrice) / sellingPrice) * 100
  return Math.max(0, round2(pct))
}
