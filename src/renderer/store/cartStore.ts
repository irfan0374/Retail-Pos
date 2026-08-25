import { create } from 'zustand'
import { calculateLineTotals, round2 } from '@shared/pricing'
import type { Product } from '@shared/types/product'

export interface CartLine {
  key: string
  product: Product
  qty: number
  unitPrice: number
  /** The system-resolved price at the moment this line was added — used only to display the implied discount %. */
  referencePrice: number
  discountAmount: number
}

interface CartState {
  lines: CartLine[]
  billDiscountAmount: number
  addProduct: (product: Product, unitPrice: number) => void
  updateLine: (key: string, patch: Partial<Pick<CartLine, 'qty' | 'unitPrice' | 'discountAmount'>>) => void
  removeLine: (key: string) => void
  setBillDiscount: (amount: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  billDiscountAmount: 0,

  addProduct: (product, unitPrice) => {
    const existing = get().lines.find((l) => l.product.id === product.id)
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
          discountAmount: 0
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

  clear: () => set({ lines: [], billDiscountAmount: 0 })
}))

export function cartTotals(lines: CartLine[], billDiscountAmount: number) {
  const perLine = lines.map((l) => calculateLineTotals(l.unitPrice, l.qty, l.discountAmount))
  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0))
  const vatAmount = round2(perLine.reduce((sum, t) => sum + t.vatAmount, 0))
  const linesAfterDiscount = round2(
    lines.reduce((sum, l) => sum + l.unitPrice * l.qty - l.discountAmount, 0)
  )
  const total = round2(linesAfterDiscount - billDiscountAmount + vatAmount)
  return { subtotal, vatAmount, total }
}
