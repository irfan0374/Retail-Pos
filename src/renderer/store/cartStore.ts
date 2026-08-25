import { create } from 'zustand'
import { round2 } from '@shared/pricing'
import { VAT_RATE } from '@shared/constants'
import type { Product } from '@shared/types/product'

export interface CartLine {
  key: string
  product: Product
  qty: number
  unitPrice: number
  /** The system-resolved price at the moment this line was added — used only to display the implied discount %. */
  referencePrice: number
  discountAmount: number
  /** Old-gold buy-back credit line — negative unitPrice, no VAT, and description overrides the product name. */
  isExchangeItem: boolean
  description?: string
}

interface CartState {
  lines: CartLine[]
  billDiscountAmount: number
  addProduct: (product: Product, unitPrice: number) => void
  addExchangeLine: (product: Product, description: string, creditAmount: number) => void
  updateLine: (key: string, patch: Partial<Pick<CartLine, 'qty' | 'unitPrice' | 'discountAmount'>>) => void
  removeLine: (key: string) => void
  setBillDiscount: (amount: number) => void
  loadLines: (lines: CartLine[], billDiscountAmount: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  billDiscountAmount: 0,

  addProduct: (product, unitPrice) => {
    const existing = get().lines.find((l) => l.product.id === product.id && !l.isExchangeItem)
    if (existing) {
      set({
        lines: get().lines.map((l) =>
          l.key === existing.key ? { ...l, qty: l.qty + 1 } : l
        )
      })
      return
    }
    set({
      lines: [
        ...get().lines,
        {
          key: `${product.id}-${Date.now()}`,
          product,
          qty: 1,
          unitPrice,
          referencePrice: unitPrice,
          discountAmount: 0,
          isExchangeItem: false
        }
      ]
    })
  },

  addExchangeLine: (product, description, creditAmount) => {
    set({
      lines: [
        ...get().lines,
        {
          key: `exchange-${Date.now()}`,
          product,
          qty: 1,
          unitPrice: -Math.abs(creditAmount),
          referencePrice: 0,
          discountAmount: 0,
          isExchangeItem: true,
          description
        }
      ]
    })
  },

  updateLine: (key, patch) => {
    set({ lines: get().lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) })
  },

  removeLine: (key) => {
    set({ lines: get().lines.filter((l) => l.key !== key) })
  },

  setBillDiscount: (amount) => set({ billDiscountAmount: amount }),

  loadLines: (lines, billDiscountAmount) => set({ lines, billDiscountAmount }),

  clear: () => set({ lines: [], billDiscountAmount: 0 })
}))

export function cartTotals(lines: CartLine[], billDiscountAmount: number) {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0))
  const vatAmount = round2(
    lines.reduce((sum, l) => {
      if (l.isExchangeItem) return sum
      const taxable = l.unitPrice * l.qty - l.discountAmount
      return sum + taxable * VAT_RATE
    }, 0)
  )
  const linesAfterDiscount = round2(
    lines.reduce((sum, l) => sum + l.unitPrice * l.qty - l.discountAmount, 0)
  )
  const total = round2(linesAfterDiscount - billDiscountAmount + vatAmount)
  return { subtotal, vatAmount, total }
}
