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

export interface SaleLineAmounts {
  unitPrice: number
  qty: number
  discountAmount: number
  isExchangeItem: boolean
}

export interface PricedSaleLine {
  /** The line's own discount plus its share of the bill-level discount. */
  discountAmount: number
  vatAmount: number
  lineTotal: number
}

export interface SaleTotals {
  lines: PricedSaleLine[]
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
}

/**
 * The bill-level discount is spread across the real (non-exchange) lines pro rata to their
 * post-line-discount amount, so VAT is only charged on what the customer actually pays. The last
 * eligible line absorbs the rounding remainder so the shares add up to the bill discount exactly.
 * Old-gold exchange credit lines carry no VAT and take no share of the bill discount.
 */
export function calculateSaleTotals(lines: SaleLineAmounts[], billDiscountAmount: number): SaleTotals {
  const taxableBeforeBill = lines.map((l) => (l.isExchangeItem ? 0 : round2(l.unitPrice * l.qty - l.discountAmount)))
  const pool = round2(taxableBeforeBill.reduce((sum, v) => sum + Math.max(v, 0), 0))
  let lastEligible = -1
  taxableBeforeBill.forEach((v, i) => {
    if (v > 0) lastEligible = i
  })

  let remaining = pool > 0 ? round2(billDiscountAmount) : 0
  const priced = lines.map((l, i): PricedSaleLine => {
    let share = 0
    if (pool > 0 && taxableBeforeBill[i] > 0) {
      share = i === lastEligible ? remaining : round2((billDiscountAmount * taxableBeforeBill[i]) / pool)
      remaining = round2(remaining - share)
    }
    const discountAmount = round2(l.discountAmount + share)
    const taxableAmount = round2(l.unitPrice * l.qty - discountAmount)
    const vatAmount = l.isExchangeItem ? 0 : calculateLineVat(taxableAmount)
    return { discountAmount, vatAmount, lineTotal: round2(taxableAmount + vatAmount) }
  })

  return {
    lines: priced,
    subtotal: round2(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)),
    discountAmount: round2(priced.reduce((sum, l) => sum + l.discountAmount, 0)),
    vatAmount: round2(priced.reduce((sum, l) => sum + l.vatAmount, 0)),
    total: round2(priced.reduce((sum, l) => sum + l.lineTotal, 0))
  }
}
