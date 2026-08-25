import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import type { MonthlySalesSummary } from '@shared/types/report'

export function MonthlySummaryScreen() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<MonthlySalesSummary[]>([])

  useEffect(() => {
    void window.api.reports.monthlySummary().then(setRows)
  }, [])

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">{t('reports.month')}</th>
            <th className="px-4 py-2">{t('reports.salesCount')}</th>
            <th className="px-4 py-2">{t('reports.subtotal')}</th>
            <th className="px-4 py-2">{t('reports.discountAmount')}</th>
            <th className="px-4 py-2">{t('reports.vatAmount')}</th>
            <th className="px-4 py-2">{t('reports.total')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.month}>
              <td className="px-4 py-2 font-medium text-slate-900">{r.month}</td>
              <td className="px-4 py-2">{r.salesCount}</td>
              <td className="px-4 py-2">{formatAed(r.subtotal)}</td>
              <td className="px-4 py-2">{formatAed(r.discountAmount)}</td>
              <td className="px-4 py-2">{formatAed(r.vatAmount)}</td>
              <td className="px-4 py-2 font-medium">{formatAed(r.total)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                —
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
