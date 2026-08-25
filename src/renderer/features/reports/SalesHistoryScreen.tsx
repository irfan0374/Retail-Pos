import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import type { Product } from '@shared/types/product'
import type { Sale, PaymentMethod } from '@shared/types/sale'
import type { SafeUser } from '@shared/types/user'

export function SalesHistoryScreen() {
  const { t } = useTranslation()
  const [sales, setSales] = useState<Sale[]>([])
  const [users, setUsers] = useState<SafeUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cashierId, setCashierId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [productId, setProductId] = useState<number | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  useEffect(() => {
    void window.api.reports.usersList().then(setUsers)
    void window.api.products.list().then(setProducts)
  }, [])

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]))

  const search = useCallback(async () => {
    setSales(
      await window.api.reports.salesHistory({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        cashierId: cashierId ?? undefined,
        paymentMethod: paymentMethod ?? undefined,
        productId: productId ?? undefined
      })
    )
  }, [dateFrom, dateTo, cashierId, paymentMethod, productId])

  useEffect(() => {
    void search()
  }, [search])

  async function handleExport() {
    if (!dateFrom || !dateTo) return
    setExportMessage(null)
    const result = await window.api.reports.exportSalesRegister(dateFrom, dateTo)
    setExportMessage(
      result.success && result.filePath
        ? t('reports.exportSuccess', { path: result.filePath })
        : t('reports.exportCancelled')
    )
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-5 gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateFrom')}
          <input type="date" className="input mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateTo')}
          <input type="date" className="input mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.cashier')}
          <select
            className="input mt-1"
            value={cashierId ?? ''}
            onChange={(e) => setCashierId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('reports.allCashiers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.paymentMethod')}
          <select
            className="input mt-1"
            value={paymentMethod ?? ''}
            onChange={(e) => setPaymentMethod((e.target.value as PaymentMethod) || null)}
          >
            <option value="">{t('reports.allMethods')}</option>
            <option value="cash">{t('checkout.cash')}</option>
            <option value="card">{t('checkout.card')}</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.product')}
          <select
            className="input mt-1"
            value={productId ?? ''}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('reports.allProducts')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => void handleExport()} disabled={!dateFrom || !dateTo} className="btn-secondary">
          {t('reports.exportExcel')}
        </button>
        {exportMessage && <p className="text-xs text-slate-500">{exportMessage}</p>}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('reports.invoiceNo')}</th>
              <th className="px-4 py-2">{t('reports.date')}</th>
              <th className="px-4 py-2">{t('reports.cashier')}</th>
              <th className="px-4 py-2">{t('reports.paymentMethod')}</th>
              <th className="px-4 py-2">{t('reports.total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 font-mono text-xs">{s.invoiceNo}</td>
                <td className="px-4 py-2 text-slate-500">{s.createdAt}</td>
                <td className="px-4 py-2">{usersById[s.cashierId]?.name ?? `#${s.cashierId}`}</td>
                <td className="px-4 py-2 capitalize">{s.paymentMethod}</td>
                <td className="px-4 py-2 font-medium">{formatAed(s.total)}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t('reports.noSales')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
