import type { Product } from './product'

export interface HeldSaleLineInput {
  productId: number
  description: string
  qty: number
  unitPrice: number
  discountAmount: number
  isExchangeItem: boolean
}

export interface NewHeldSaleInput {
  note: string | null
  billDiscountAmount: number
  items: HeldSaleLineInput[]
}

export interface HeldSaleItem {
  id: number
  heldSaleId: number
  product: Product
  description: string
  qty: number
  unitPrice: number
  discountAmount: number
  isExchangeItem: boolean
}

export interface HeldSale {
  id: number
  cashierId: number
  note: string | null
  billDiscountAmount: number
  createdAt: string
}

export interface HeldSaleWithItems extends HeldSale {
  items: HeldSaleItem[]
}
