export type ProductType = 'jewelry' | 'gift'
export type MetalType = 'gold' | 'silver' | 'platinum' | 'imitation'
export type MakingChargeType = 'fixed' | 'percent'

export interface Category {
  id: number
  name: string
  appliesTo: 'jewelry' | 'gift' | 'both'
}

export interface Product {
  id: number
  barcode: string
  sku: string | null
  name: string
  type: ProductType
  categoryId: number | null
  // jewelry-only
  metalType: MetalType | null
  purity: string | null
  grossWeight: number | null
  netWeight: number | null
  stoneWeight: number | null
  makingCharge: number | null
  makingChargeType: MakingChargeType | null
  wastagePct: number | null
  isRateBased: boolean
  hallmarkNo: string | null
  // shared
  costPrice: number
  sellingPrice: number
  stockQty: number
  lowStockThreshold: number
  supplierId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type NewProductInput = Omit<
  Product,
  'id' | 'barcode' | 'isActive' | 'createdAt' | 'updatedAt'
>

export type UpdateProductInput = Partial<NewProductInput> & { id: number }

export interface MetalRate {
  id: number
  date: string
  metalType: MetalType
  purity: string
  ratePerGram: number
  createdBy: number | null
  createdAt: string
}
