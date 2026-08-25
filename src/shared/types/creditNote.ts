export interface CreditNoteLineInput {
  saleItemId: number
  qty: number
}

export interface NewCreditNoteInput {
  saleId: number
  reason: string | null
  items: CreditNoteLineInput[]
}

export interface CreditNoteItem {
  id: number
  creditNoteId: number
  saleItemId: number
  productId: number
  qty: number
  unitPrice: number
  vatAmount: number
  lineTotal: number
}

export interface CreditNote {
  id: number
  creditNoteNo: string
  saleId: number
  reason: string | null
  subtotal: number
  vatAmount: number
  total: number
  createdBy: number | null
  createdAt: string
}

export interface CreditNoteWithItems extends CreditNote {
  items: CreditNoteItem[]
}
