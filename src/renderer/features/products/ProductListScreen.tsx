import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { RoleGate } from '../../app/RoleGate'
import { useAuthStore } from '../../store/authStore'
import { can } from '@shared/constants'
import { formatAed } from '../../lib/format'
import { ProductFormModal } from './ProductFormModal'
import { BarcodeLabelPreview } from './BarcodeLabelPreview'
import type { Category, Product } from '@shared/types/product'
import type { Supplier } from '@shared/types/supplier'

export function ProductListScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const canEdit = !!user && can(user.role, 'products.write')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [labelFor, setLabelFor] = useState<Product | null>(null)

  const load = useCallback(async () => {
    const [productList, categoryList, supplierList] = await Promise.all([
      window.api.products.list({ activeOnly: true }),
      window.api.categories.list(),
      canEdit ? window.api.suppliers.list() : Promise.resolve<Supplier[]>([])
    ])
    setProducts(productList)
    setCategories(categoryList)
    setSuppliers(supplierList)
  }, [canEdit])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete(product: Product) {
    if (!window.confirm(t('products.deleteConfirm', { name: product.name }))) return
    await window.api.products.deactivate(product.id)
    void load()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('products.title')}</h1>
        <RoleGate permission="products.write">
          <button onClick={() => setEditing('new')} className="btn-primary flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            {t('products.newProduct')}
          </button>
        </RoleGate>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('products.name')}</th>
              <th className="px-4 py-2">{t('products.barcode')}</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">{t('products.sellingPrice')}</th>
              <th className="px-4 py-2">{t('products.stockQty')}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <span className="font-medium text-slate-900">{p.name}</span>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{p.barcode}</td>
                <td className="px-4 py-2 capitalize">{p.type}</td>
                <td className="px-4 py-2">{formatAed(p.sellingPrice)}</td>
                <td className="px-4 py-2">
                  <span>{p.stockQty}</span>
                  {p.stockQty <= p.lowStockThreshold && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {t('products.lowStock')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    {canEdit && (
                      <button
                        onClick={() => setEditing(p)}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t('products.edit')}
                      </button>
                    )}
                    <button
                      onClick={() => setLabelFor(p)}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      {t('products.printLabel')}
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => void handleDelete(p)}
                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('products.delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductFormModal
          categories={categories}
          suppliers={suppliers}
          existing={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void load()
          }}
        />
      )}

      {labelFor && <BarcodeLabelPreview product={labelFor} onClose={() => setLabelFor(null)} />}
    </div>
  )
}
