export interface Supplier {
  id: number
  name: string
  phone: string | null
  address: string | null
}

export type NewSupplierInput = Omit<Supplier, 'id'>
export type UpdateSupplierInput = NewSupplierInput & { id: number }

export interface SupplierPayment {
  id: number
  supplierId: number
  amount: number
  method: string | null
  note: string | null
  createdBy: number | null
  createdAt: string
}

export type NewSupplierPaymentInput = Omit<SupplierPayment, 'id' | 'createdBy' | 'createdAt'>

export interface SupplierLedger {
  supplierId: number
  totalPurchased: number
  totalReturned: number
  totalPaid: number
  balanceOwed: number
}
