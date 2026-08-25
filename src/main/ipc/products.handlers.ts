import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import { listCategories } from '../db/repositories/categories.repo'
import {
  createProduct,
  deactivateProduct,
  findProductByBarcode,
  listProducts,
  searchProducts,
  updateProduct
} from '../db/repositories/products.repo'
import { renderBarcodePng } from '../services/barcode.service'

const newProductSchema = z.object({
  sku: z.string().nullable(),
  name: z.string().min(1),
  type: z.enum(['jewelry', 'gift']),
  categoryId: z.number().nullable(),
  metalType: z.enum(['gold', 'silver', 'platinum', 'imitation']).nullable(),
  purity: z.string().nullable(),
  grossWeight: z.number().nullable(),
  netWeight: z.number().nullable(),
  stoneWeight: z.number().nullable(),
  makingCharge: z.number().nullable(),
  makingChargeType: z.enum(['fixed', 'percent']).nullable(),
  wastagePct: z.number().nullable(),
  isRateBased: z.boolean(),
  hallmarkNo: z.string().nullable(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stockQty: z.number(),
  lowStockThreshold: z.number(),
  supplierId: z.number().nullable()
})

const updateProductSchema = newProductSchema.partial().extend({ id: z.number() })

export function registerProductHandlers(): void {
  ipcMain.handle(IPC.PRODUCTS_LIST, (_event, filter) => {
    requirePermission('products.read')
    return listProducts(filter)
  })

  ipcMain.handle(IPC.PRODUCTS_SEARCH, (_event, query) => {
    requirePermission('products.read')
    return searchProducts(String(query ?? ''))
  })

  ipcMain.handle(IPC.PRODUCTS_FIND_BY_BARCODE, (_event, barcode) => {
    requirePermission('products.read')
    return findProductByBarcode(String(barcode))
  })

  ipcMain.handle(IPC.PRODUCTS_CREATE, (_event, payload) => {
    const user = requirePermission('products.write')
    const input = newProductSchema.parse(payload)
    const product = createProduct(input)
    recordAuditLog({
      userId: user.id,
      action: 'products.create',
      tableName: 'products',
      recordId: product.id,
      details: { name: product.name, sellingPrice: product.sellingPrice }
    })
    return product
  })

  ipcMain.handle(IPC.PRODUCTS_UPDATE, (_event, payload) => {
    const user = requirePermission('products.write')
    const input = updateProductSchema.parse(payload)
    const product = updateProduct(input)
    recordAuditLog({
      userId: user.id,
      action: 'products.update',
      tableName: 'products',
      recordId: product.id,
      details: { name: product.name, sellingPrice: product.sellingPrice }
    })
    return product
  })

  ipcMain.handle(IPC.PRODUCTS_DEACTIVATE, (_event, id) => {
    const user = requirePermission('products.write')
    deactivateProduct(Number(id))
    recordAuditLog({ userId: user.id, action: 'products.deactivate', tableName: 'products', recordId: Number(id) })
  })

  ipcMain.handle(IPC.PRODUCTS_GET_BARCODE_IMAGE, (_event, barcode) => {
    requirePermission('products.read')
    return renderBarcodePng(String(barcode))
  })

  ipcMain.handle(IPC.CATEGORIES_LIST, () => {
    requirePermission('products.read')
    return listCategories()
  })
}
