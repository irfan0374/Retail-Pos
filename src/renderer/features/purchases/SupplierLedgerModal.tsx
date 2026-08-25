import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { formatAed } from '../../lib/format'
import { SupplierPaymentModal } from './SupplierPaymentModal'
import type { Supplier, SupplierLedger, SupplierPayment } from '@shared/types/supplier'

export function SupplierLedgerModal({
  supplier,
  onClose
}: {
  supplier: Supplier
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [ledger, setLedger] = useState<SupplierLedger | null>(null)
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [recordingPayment, setRecordingPayment] = useState(false)

  const load = useCallback(async () => {
    const [ledgerResult, paymentsResult] = await Promise.all([
      window.api.suppliers.getLedger(supplier.id),
      window.api.suppliers.listPayments(supplier.id)
    ])
    setLedger(ledgerResult)
    setPayments(paymentsResult)
  }, [supplier.id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Modal title={`${t('suppliers.ledger')} — ${supplier.name}`} onClose={onClose}>
      {ledger && (
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs uppercase text-slate-500">{t('suppliers.totalPurchased')}</div>
            <div className="font-semibold">{formatAed(ledger.totalPurchased)}</div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs uppercase text-slate-500">{t('suppliers.totalReturned')}</div>
            <div className="font-semibold">{formatAed(ledger.totalReturned)}</div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs uppercase text-slate-500">{t('suppliers.totalPaid')}</div>
            <div className="font-semibold">{formatAed(ledger.totalPaid)}</div>
          </div>
          <div className="rounded-md bg-amber-50 p-3">
            <div className="text-xs uppercase text-amber-700">{t('suppliers.balanceOwed')}</div>
            <div className="font-semibold text-amber-900">{formatAed(ledger.balanceOwed)}</div>
          </div>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{t('suppliers.paymentHistory')}</h3>
        <button onClick={() => setRecordingPayment(true)} className="btn-secondary text-sm">
          {t('suppliers.recordPayment')}
        </button>
      </div>
      <div className="max-h-48 overflow-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 text-slate-500">{p.createdAt}</td>
                <td className="px-3 py-2">{p.method ?? '—'}</td>
                <td className="px-3 py-2">{p.note ?? ''}</td>
                <td className="px-3 py-2 text-right font-medium">{formatAed(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  {t('suppliers.noPayments')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {recordingPayment && (
        <SupplierPaymentModal
          supplierId={supplier.id}
          onClose={() => setRecordingPayment(false)}
          onSaved={() => {
            setRecordingPayment(false)
            void load()
          }}
        />
      )}
    </Modal>
  )
}
