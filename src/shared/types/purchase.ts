export interface PurchaseLineInput {
  productId: number
  qty: number
  unitCost: number
}

export interface NewPurchaseInput {
  supplierId: number
  invoiceRef: string | null
  items: PurchaseLineInput[]
}

export interface PurchaseItem {
  id: number
  purchaseId: number
  productId: number
  qty: number
  unitCost: number
  lineTotal: number
}

export interface Purchase {
  id: number
  supplierId: number
  invoiceRef: string | null
  date: string
  subtotal: number
  total: number
  createdBy: number | null
  createdAt: string
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[]
}

export interface PurchaseReturnLineInput {
  purchaseItemId: number
  productId: number
  qty: number
  unitCost: number
}

export interface NewPurchaseReturnInput {
  purchaseId: number
  reason: string | null
  items: PurchaseReturnLineInput[]
}

export interface PurchaseReturnItem {
  id: number
  purchaseReturnId: number
  purchaseItemId: number
  productId: number
  qty: number
  unitCost: number
  lineTotal: number
}

export interface PurchaseReturn {
  id: number
  purchaseId: number
  reason: string | null
  total: number
  createdBy: number | null
  createdAt: string
}

export interface PurchaseReturnWithItems extends PurchaseReturn {
  items: PurchaseReturnItem[]
}

export type StockMovementType = 'purchase' | 'purchase_return' | 'sale'

export interface StockMovement {
  id: number
  productId: number
  qtyDelta: number
  movementType: StockMovementType
  referenceTable: string
  referenceId: number
  createdAt: string
}
