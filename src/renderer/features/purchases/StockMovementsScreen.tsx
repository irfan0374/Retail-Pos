import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Product } from '@shared/types/product'
import type { StockMovement } from '@shared/types/purchase'

export function StockMovementsScreen() {
  const { t } = useTranslation()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productsById, setProductsById] = useState<Record<number, Product>>({})
  const [productFilter, setProductFilter] = useState<number | null>(null)

  const loadProducts = useCallback(async () => {
    const list = await window.api.products.list()
    setProducts(list)
    setProductsById(Object.fromEntries(list.map((p) => [p.id, p])))
  }, [])

  const loadMovements = useCallback(async () => {
    setMovements(await window.api.purchases.listStockMovements(productFilter ? { productId: productFilter } : undefined))
  }, [productFilter])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    void loadMovements()
  }, [loadMovements])

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('purchases.filterByProduct')}
          <select
            className="input mt-1 max-w-xs"
            value={productFilter ?? ''}
            onChange={(e) => setProductFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('purchases.allProducts')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('purchases.date')}</th>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">{t('purchases.movementType')}</th>
              <th className="px-4 py-2">{t('purchases.movementQty')}</th>
              <th className="px-4 py-2">{t('purchases.movementReference')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 text-slate-500">{m.createdAt}</td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {productsById[m.productId]?.name ?? `#${m.productId}`}
                </td>
                <td className="px-4 py-2">{t(`purchases.type${toPascal(m.movementType)}`)}</td>
                <td className={`px-4 py-2 font-medium ${m.qtyDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {m.qtyDelta >= 0 ? '+' : ''}
                  {m.qtyDelta}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {m.referenceTable}#{m.referenceId}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function toPascal(movementType: string): string {
  return movementType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
