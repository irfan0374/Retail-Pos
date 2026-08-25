import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PauseCircle, PlayCircle, Repeat, CheckCircle2 } from 'lucide-react'
import { useCartStore, type CartLine } from '../../store/cartStore'
import { resolveDisplayUnitPrice } from '../../lib/resolvePrice'
import { EXCHANGE_PLACEHOLDER_SKU } from '@shared/constants'
import { ScanInput } from './ScanInput'
import { CartPanel } from './CartPanel'
import { OrderSummaryPanel } from './OrderSummaryPanel'
import { PaymentPanel } from './PaymentPanel'
import { ManagerOverrideModal } from './ManagerOverrideModal'
import { ReceiptPreview } from './ReceiptPreview'
import { HoldSaleModal } from './HoldSaleModal'
import { ResumeSaleModal } from './ResumeSaleModal'
import { OldGoldExchangeModal } from './OldGoldExchangeModal'
import { useSettingsStore } from '../../store/settingsStore'
import type { MetalRate, Product } from '@shared/types/product'
import type { ManagerOverride, PaymentMethod, SaleWithItems } from '@shared/types/sale'
import type { HeldSaleWithItems } from '@shared/types/heldSale'

const MANAGER_OVERRIDE_ERROR = 'manager override required'

export function CheckoutScreen() {
  const { t } = useTranslation()
  const lines = useCartStore((s) => s.lines)
  const billDiscountAmount = useCartStore((s) => s.billDiscountAmount)
  const addProduct = useCartStore((s) => s.addProduct)
  const addExchangeLine = useCartStore((s) => s.addExchangeLine)
  const loadLines = useCartStore((s) => s.loadLines)
  const clearCart = useCartStore((s) => s.clear)
  const settings = useSettingsStore((s) => s.settings)

  const [rates, setRates] = useState<MetalRate[]>([])
  const [exchangeProduct, setExchangeProduct] = useState<Product | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsOverride, setNeedsOverride] = useState(false)
  const [receipt, setReceipt] = useState<SaleWithItems | null>(null)
  const [holding, setHolding] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    void window.api.metalRates.listLatest().then(setRates)
    void window.api.products.findBySku(EXCHANGE_PLACEHOLDER_SKU).then(setExchangeProduct)
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
        paymentMethod: method,
        billDiscountAmount,
        items: lines.map((l) => ({
          productId: l.product.id,
          qty: l.qty,
          unitPrice: l.unitPrice,
          discountAmount: l.discountAmount,
          isExchangeItem: l.isExchangeItem,
          description: l.description
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

  async function handleHold(note: string | null) {
    await window.api.heldSales.create({
      note,
      billDiscountAmount,
      items: lines.map((l) => ({
        productId: l.product.id,
        description: l.description ?? l.product.name,
        qty: l.qty,
        unitPrice: l.unitPrice,
        discountAmount: l.discountAmount,
        isExchangeItem: l.isExchangeItem
      }))
    })
    clearCart()
    setHolding(false)
  }

  function handleResume(heldSale: HeldSaleWithItems) {
    const resumedLines: CartLine[] = heldSale.items.map((item) => ({
      key: `resumed-${item.id}-${Date.now()}`,
      product: item.product,
      qty: item.qty,
      unitPrice: item.unitPrice,
      referencePrice: item.unitPrice,
      discountAmount: item.discountAmount,
      isExchangeItem: item.isExchangeItem,
      description: item.isExchangeItem ? item.description : undefined
    }))
    loadLines(resumedLines, heldSale.billDiscountAmount)
    setResuming(false)
  }

  function handleAddExchange(description: string, creditAmount: number) {
    if (exchangeProduct) addExchangeLine(exchangeProduct, description, creditAmount)
    setExchanging(false)
  }

  return (
    <div className="grid h-full grid-cols-3 gap-4">
      <div className="col-span-2 flex flex-col gap-4">
        <ScanInput onResolved={handleResolved} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHolding(true)}
            disabled={lines.length === 0}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <PauseCircle className="h-4 w-4" />
            {t('checkout.holdSale')}
          </button>
          <button onClick={() => setResuming(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
            <PlayCircle className="h-4 w-4" />
            {t('checkout.resumeSale')}
          </button>
          {settings?.showOldGoldExchange !== false && (
            <button
              onClick={() => setExchanging(true)}
              disabled={!exchangeProduct}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Repeat className="h-4 w-4" />
              {t('checkout.oldGoldExchange')}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <CartPanel />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <OrderSummaryPanel />
        <PaymentPanel method={method} onMethodChange={setMethod} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={() => void finalize()}
          disabled={submitting || lines.length === 0}
          className="btn-primary mt-auto flex w-full items-center justify-center gap-2 py-3 text-base"
        >
          <CheckCircle2 className="h-5 w-5" />
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

      {holding && <HoldSaleModal onClose={() => setHolding(false)} onHold={(note) => void handleHold(note)} />}

      {resuming && <ResumeSaleModal onClose={() => setResuming(false)} onResume={handleResume} />}

      {exchanging && (
        <OldGoldExchangeModal onClose={() => setExchanging(false)} onAdd={handleAddExchange} />
      )}
    </div>
  )
}
