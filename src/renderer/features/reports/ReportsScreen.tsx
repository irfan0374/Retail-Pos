import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SalesHistoryScreen } from './SalesHistoryScreen'
import { MonthlySummaryScreen } from './MonthlySummaryScreen'
import { VatReportScreen } from './VatReportScreen'
import { ZReportScreen } from './ZReportScreen'
import { PurchaseRegisterExportScreen } from './PurchaseRegisterExportScreen'

type Tab = 'history' | 'monthly' | 'vat' | 'zreport' | 'purchaseRegister'

export function ReportsScreen() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('history')

  const tabs: { tab: Tab; label: string }[] = [
    { tab: 'history', label: t('reports.tabHistory') },
    { tab: 'monthly', label: t('reports.tabMonthly') },
    { tab: 'vat', label: t('reports.tabVat') },
    { tab: 'zreport', label: t('reports.tabZReport') },
    { tab: 'purchaseRegister', label: t('reports.tabPurchaseRegister') }
  ]

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t('reports.title')}</h1>
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {tabs.map((item) => (
          <button
            key={item.tab}
            onClick={() => setTab(item.tab)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === item.tab
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'history' && <SalesHistoryScreen />}
      {tab === 'monthly' && <MonthlySummaryScreen />}
      {tab === 'vat' && <VatReportScreen />}
      {tab === 'zreport' && <ZReportScreen />}
      {tab === 'purchaseRegister' && <PurchaseRegisterExportScreen />}
    </div>
  )
}
