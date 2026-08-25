import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SupplierFormModal } from './SupplierFormModal'
import { SupplierLedgerModal } from './SupplierLedgerModal'
import type { Supplier } from '@shared/types/supplier'

export function SupplierListScreen() {
  const { t } = useTranslation()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null)
  const [viewingLedgerFor, setViewingLedgerFor] = useState<Supplier | null>(null)

  const load = useCallback(async () => {
    setSuppliers(await window.api.suppliers.list())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('suppliers.title')}</h2>
        <button onClick={() => setEditing('new')} className="btn-primary">
          {t('suppliers.newSupplier')}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('suppliers.name')}</th>
              <th className="px-4 py-2">{t('suppliers.phone')}</th>
              <th className="px-4 py-2">{t('suppliers.address')}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-2 text-slate-500">{s.phone ?? '—'}</td>
                <td className="px-4 py-2 text-slate-500">{s.address ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setViewingLedgerFor(s)}
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      {t('suppliers.ledger')}
                    </button>
                    <button onClick={() => setEditing(s)} className="text-sm text-slate-500 hover:text-slate-900">
                      {t('products.edit')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SupplierFormModal
          existing={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void load()
          }}
        />
      )}

      {viewingLedgerFor && (
        <SupplierLedgerModal supplier={viewingLedgerFor} onClose={() => setViewingLedgerFor(null)} />
      )}
    </div>
  )
}
