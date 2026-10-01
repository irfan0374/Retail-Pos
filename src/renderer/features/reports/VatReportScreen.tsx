import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { formatAed, localDateIso } from '../../lib/format'
import type { VatSummary } from '@shared/types/report'

export function VatReportScreen() {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState(localDateIso())
  const [dateTo, setDateTo] = useState(localDateIso())
  const [summary, setSummary] = useState<VatSummary | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setSummary(await window.api.reports.vatSummary(dateFrom, dateTo))
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    setExportMessage(null)
    const result = await window.api.reports.exportVatReport(dateFrom, dateTo)
    setExportMessage(
      result.success && result.filePath
        ? t('reports.exportSuccess', { path: result.filePath })
        : t('reports.exportCancelled')
    )
  }

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-end gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateFrom')}
          <input type="date" className="input mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateTo')}
          <input type="date" className="input mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <button onClick={() => void load()} disabled={loading} className="btn-primary">
          {t('reports.filter')}
        </button>
      </div>

      {summary && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div className="flex justify-between">
            <span>{t('reports.period')}</span>
            <span>
              {summary.dateFrom} — {summary.dateTo}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('reports.salesCount')}</span>
            <span>{summary.salesCount}</span>
          </div>
          <div className="flex justify-between">
            <span>
              {t('reports.creditNotes')} ({summary.creditNoteCount})
            </span>
            <span>-{formatAed(summary.creditNoteTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('reports.taxableAmount')}</span>
            <span>{formatAed(summary.taxableAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('reports.vatAmount')}</span>
            <span>{formatAed(summary.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{t('reports.totalAmount')}</span>
            <span>{formatAed(summary.totalAmount)}</span>
          </div>
          <button
            onClick={() => void handleExport()}
            className="btn-primary mt-3 flex w-full items-center justify-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            {t('reports.exportVatFiling')}
          </button>
          {exportMessage && <p className="text-xs text-slate-500">{exportMessage}</p>}
        </div>
      )}
    </div>
  )
}
