import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RecordPurchaseScreen } from './RecordPurchaseScreen'
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen'
import { SupplierListScreen } from './SupplierListScreen'
import { StockMovementsScreen } from './StockMovementsScreen'

type Tab = 'record' | 'history' | 'suppliers' | 'movements'

export function PurchasesScreen() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('record')

  const tabs: { tab: Tab; label: string }[] = [
    { tab: 'record', label: t('purchases.tabRecord') },
    { tab: 'history', label: t('purchases.tabHistory') },
    { tab: 'suppliers', label: t('purchases.tabSuppliers') },
    { tab: 'movements', label: t('purchases.tabMovements') }
  ]

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t('purchases.title')}</h1>
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

      {tab === 'record' && <RecordPurchaseScreen />}
      {tab === 'history' && <PurchaseHistoryScreen />}
      {tab === 'suppliers' && <SupplierListScreen />}
      {tab === 'movements' && <StockMovementsScreen />}
    </div>
  )
}
