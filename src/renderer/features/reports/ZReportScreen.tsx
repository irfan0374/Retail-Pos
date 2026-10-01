import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { round2 } from '@shared/pricing'
import { formatAed, localDateIso } from '../../lib/format'
import type { ZReport } from '@shared/types/report'

export function ZReportScreen() {
  const { t } = useTranslation()
  const [date, setDate] = useState(localDateIso())
  const [report, setReport] = useState<ZReport | null>(null)
  const [actualCash, setActualCash] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setReport(await window.api.reports.zReport(date))
      setActualCash('')
    } finally {
      setLoading(false)
    }
  }

  const variance = report && actualCash !== '' ? round2(Number(actualCash) - report.expectedCash) : null

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-end gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.selectDate')}
          <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button onClick={() => void load()} disabled={loading} className="btn-primary">
          {t('reports.filter')}
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="flex justify-between">
              <span>{t('reports.salesCount')}</span>
              <span>{report.salesCount}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reports.subtotal')}</span>
              <span>{formatAed(report.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reports.discountAmount')}</span>
              <span>{formatAed(report.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reports.vatAmount')}</span>
              <span>{formatAed(report.vatAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>{t('reports.total')}</span>
              <span>{formatAed(report.total)}</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <h3 className="mb-2 font-semibold text-slate-700">{t('reports.byPaymentMethod')}</h3>
            {report.byPaymentMethod.map((m) => (
              <div key={m.method} className="flex justify-between py-1">
                <span className="capitalize">
                  {m.method} ({m.count})
                </span>
                <span>{formatAed(m.total)}</span>
              </div>
            ))}
            {report.byPaymentMethod.length === 0 && <p className="text-slate-400">—</p>}
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <div className="flex justify-between">
              <span>
                {t('reports.refunds')} ({report.refundCount})
              </span>
              <span>-{formatAed(report.refundTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('reports.expectedCash')}</span>
              <span className="font-medium">{formatAed(report.expectedCash)}</span>
            </div>
            <label className="flex items-center justify-between gap-2">
              <span>{t('reports.actualCash')}</span>
              <input
                type="number"
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-32 rounded border border-slate-200 px-2 py-1 text-right"
              />
            </label>
            {variance !== null && (
              <div className={`flex justify-between font-medium ${variance === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                <span>{t('reports.variance')}</span>
                <span>{formatAed(variance)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
