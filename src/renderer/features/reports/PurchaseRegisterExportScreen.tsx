import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { localDateIso } from '../../lib/format'

export function PurchaseRegisterExportScreen() {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState(localDateIso())
  const [dateTo, setDateTo] = useState(localDateIso())
  const [message, setMessage] = useState<string | null>(null)

  async function handleExport() {
    setMessage(null)
    const result = await window.api.reports.exportPurchaseRegister(dateFrom, dateTo)
    setMessage(
      result.success && result.filePath
        ? t('reports.exportSuccess', { path: result.filePath })
        : t('reports.exportCancelled')
    )
  }

  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-end gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateFrom')}
          <input type="date" className="input mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('reports.dateTo')}
          <input type="date" className="input mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <button onClick={() => void handleExport()} className="btn-primary">
          {t('reports.exportExcel')}
        </button>
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  )
}
