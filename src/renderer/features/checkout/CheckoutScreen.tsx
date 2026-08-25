import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '../../store/cartStore'
import { resolveDisplayUnitPrice } from '../../lib/resolvePrice'
import { ScanInput } from './ScanInput'
import { CartPanel } from './CartPanel'
import { PaymentPanel } from './PaymentPanel'
import { ManagerOverrideModal } from './ManagerOverrideModal'
import { ReceiptPreview } from './ReceiptPreview'
import type { MetalRate, Product } from '@shared/types/product'
import type { ManagerOverride, PaymentChannel, PaymentMethod, SaleWithItems } from '@shared/types/sale'

const MANAGER_OVERRIDE_ERROR = 'manager override required'

export function CheckoutScreen() {
  const { t } = useTranslation()
  const lines = useCartStore((s) => s.lines)
  const billDiscountAmount = useCartStore((s) => s.billDiscountAmount)
  const addProduct = useCartStore((s) => s.addProduct)
  const clearCart = useCartStore((s) => s.clear)

  const [rates, setRates] = useState<MetalRate[]>([])
  const [channel, setChannel] = useState<PaymentChannel>('offline')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsOverride, setNeedsOverride] = useState(false)
  const [receipt, setReceipt] = useState<SaleWithItems | null>(null)

  useEffect(() => {
    void window.api.metalRates.listLatest().then(setRates)
  }, [])

  function handleResolved(product: Product) {
    addProduct(product, resolveDisplayUnitPrice(product, rates))
  }

  async function finalize(managerOverride?: ManagerOverride) {
    setSubmitting(true)
    setError(null)
    try {
      const sale = await window.api.sales.finalize({
        customerId: null,
        paymentChannel: channel,
        paymentMethod: method,
        billDiscountAmount,
        items: lines.map((l) => ({
          productId: l.product.id,
          qty: l.qty,
          unitPrice: l.unitPrice,
          discountAmount: l.discountAmount
        })),
        managerOverride
      })
      setReceipt(sale)
      setNeedsOverride(false)
      clearCart()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes(MANAGER_OVERRIDE_ERROR)) {
        setNeedsOverride(true)
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid h-full grid-cols-3 gap-4">
      <div className="col-span-2 flex flex-col gap-4">
        <ScanInput onResolved={handleResolved} />
        <div className="flex-1 overflow-hidden">
          <CartPanel />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <PaymentPanel channel={channel} method={method} onChannelChange={setChannel} onMethodChange={setMethod} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={() => void finalize()}
          disabled={submitting || lines.length === 0}
          className="btn-primary w-full py-3 text-base"
        >
          {t('checkout.finalize')}
        </button>
      </div>

      {needsOverride && (
        <ManagerOverrideModal
          onCancel={() => setNeedsOverride(false)}
          onApprove={(override) => void finalize(override)}
        />
      )}

      {receipt && <ReceiptPreview sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}
