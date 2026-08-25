import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import { round2 } from '@shared/pricing'
import { SupplierFormModal } from './SupplierFormModal'
import type { Product } from '@shared/types/product'
import type { Supplier } from '@shared/types/supplier'

interface DraftLine {
  key: string
  product: Product
  qty: number
  unitCost: number
}

export function RecordPurchaseScreen() {
  const { t } = useTranslation()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [invoiceRef, setInvoiceRef] = useState('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [lines, setLines] = useState<DraftLine[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadSuppliers = useCallback(async () => {
    setSuppliers(await window.api.suppliers.list())
  }, [])

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      void window.api.products.search(query.trim()).then(setResults)
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  function addLine(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, qty: l.qty + 1 } : l))
      }
      return [...prev, { key: `${product.id}-${Date.now()}`, product, qty: 1, unitCost: product.costPrice }]
    })
    setQuery('')
    setResults([])
  }

  function updateLine(key: string, patch: Partial<Pick<DraftLine, 'qty' | 'unitCost'>>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  const total = round2(lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0))

  async function handleSubmit() {
    if (!supplierId || lines.length === 0) return
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await window.api.purchases.create({
        supplierId,
        invoiceRef: invoiceRef || null,
        items: lines.map((l) => ({ productId: l.product.id, qty: l.qty, unitCost: l.unitCost }))
      })
      setLines([])
      setInvoiceRef('')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('purchases.supplier')}
          <div className="mt-1 flex gap-2">
            <select
              className="input"
              value={supplierId ?? ''}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('purchases.selectSupplier')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCreatingSupplier(true)}
              className="btn-secondary shrink-0 px-3"
              title={t('suppliers.newSupplier')}
            >
              +
            </button>
          </div>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('purchases.invoiceRef')}
          <input
            className="input mt-1"
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
          />
        </label>
      </div>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('purchases.searchProduct')}
          className="input"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addLine(p)}
                  className="flex w-full justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span>{p.name}</span>
                  <span className="font-mono text-xs text-slate-400">{p.barcode}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-2 py-2">{t('purchases.qty')}</th>
              <th className="px-2 py-2">{t('purchases.unitCost')}</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l) => (
              <tr key={l.key}>
                <td className="px-4 py-2">{l.product.name}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0.001}
                    step="0.001"
                    value={l.qty}
                    onChange={(e) => updateLine(l.key, { qty: Number(e.target.value) })}
                    className="w-20 rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={l.unitCost}
                    onChange={(e) => updateLine(l.key, { unitCost: Number(e.target.value) })}
                    className="w-24 rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <button onClick={() => removeLine(l.key)} className="text-slate-400 hover:text-red-600">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  {t('purchases.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-base font-semibold">
          {t('purchases.total')}: {formatAed(total)}
        </div>
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting || !supplierId || lines.length === 0}
          className="btn-primary"
        >
          {t('purchases.recordPurchase')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{t('purchases.purchaseRecorded')}</p>}

      {creatingSupplier && (
        <SupplierFormModal
          onClose={() => setCreatingSupplier(false)}
          onSaved={(supplier) => {
            setSuppliers((prev) => [...prev, supplier].sort((a, b) => a.name.localeCompare(b.name)))
            setSupplierId(supplier.id)
            setCreatingSupplier(false)
          }}
        />
      )}
    </div>
  )
}
