export type PaymentMethod = 'cash' | 'card'
export type SaleStatus = 'completed' | 'void' | 'held'

export interface CartLineInput {
  productId: number
  qty: number
  /** Price the cashier is charging per unit — may differ from the product's stored selling price.
   *  Negative for an old-gold exchange credit line. */
  unitPrice: number
  discountAmount: number
  isExchangeItem?: boolean
  /** Free-text line description — required for exchange items (e.g. "Old Gold 22K 10.5g @ 220/g"),
   *  since they don't have a meaningful catalog product name. Ignored for normal lines. */
  description?: string
}

export interface ManagerOverride {
  managerPin: string
}

export interface FinalizeSaleInput {
  customerId: number | null
  paymentMethod: PaymentMethod
  billDiscountAmount: number
  items: CartLineInput[]
  managerOverride?: ManagerOverride
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  description: string
  qty: number
  unitPrice: number
  discountAmount: number
  vatAmount: number
  lineTotal: number
  isExchangeItem: boolean
}

export interface Sale {
  id: number
  invoiceNo: string
  createdAt: string
  customerId: number | null
  paymentMethod: PaymentMethod
  cashierId: number
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
  status: SaleStatus
}

export interface SaleWithItems extends Sale {
  items: SaleItem[]
}

/** The sale is committed even when printing fails — `printError` tells the cashier to reprint. */
export interface FinalizedSale extends SaleWithItems {
  printError?: string
}
