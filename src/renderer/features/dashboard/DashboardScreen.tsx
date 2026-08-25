import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import type { DashboardSummary, SlowMovingProduct, TopSellingProduct } from '@shared/types/report'

export function DashboardScreen() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [topSelling, setTopSelling] = useState<TopSellingProduct[]>([])
  const [slowMoving, setSlowMoving] = useState<SlowMovingProduct[]>([])

  useEffect(() => {
    void window.api.dashboard.summary().then(setSummary)
    void window.api.dashboard.topSelling().then(setTopSelling)
    void window.api.dashboard.slowMoving().then(setSlowMoving)
  }, [])

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t('dashboard.title')}</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">{t('dashboard.revenueToday')}</div>
          <div className="mt-1 text-2xl font-semibold">{summary ? formatAed(summary.revenueToday) : '—'}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">{t('dashboard.revenueThisMonth')}</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary ? formatAed(summary.revenueThisMonth) : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">{t('dashboard.marginThisMonth')}</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary ? `${summary.marginThisMonthPct.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
            {t('dashboard.topSelling')}
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">{t('dashboard.qtySold')}</th>
                <th className="px-4 py-2">{t('dashboard.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSelling.map((p) => (
                <tr key={p.productId}>
                  <td className="px-4 py-2">{p.productName}</td>
                  <td className="px-4 py-2">{p.qtySold}</td>
                  <td className="px-4 py-2">{formatAed(p.revenue)}</td>
                </tr>
              ))}
              {topSelling.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
            {t('dashboard.slowMoving')}
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">{t('dashboard.stockQty')}</th>
                <th className="px-4 py-2">{t('dashboard.lastSold')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slowMoving.map((p) => (
                <tr key={p.productId}>
                  <td className="px-4 py-2">{p.productName}</td>
                  <td className="px-4 py-2">{p.stockQty}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {p.lastSoldAt ?? t('dashboard.neverSold')}
                  </td>
                </tr>
              ))}
              {slowMoving.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
