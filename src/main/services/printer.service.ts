import { getSettings } from '../db/repositories/settings.repo'
import type { SaleWithItems } from '@shared/types/sale'
import type { ShopSettings } from '@shared/types/settings'

export interface IReceiptPrinter {
  printReceipt(sale: SaleWithItems): Promise<void>
  /** Not wired into the checkout flow yet — auto cash-drawer open lands in Phase 4. */
  openDrawer(): Promise<void>
}

/** FTA tax invoice fields: TRN, sequential invoice number, date, item description/qty/price, VAT amount, total. */
function formatReceiptText(sale: SaleWithItems, settings: ShopSettings): string {
  const lines = [
    settings.shopName || 'RetailKey POS',
    settings.trn ? `TRN: ${settings.trn}` : null,
    `Invoice: ${sale.invoiceNo}`,
    `Date: ${sale.createdAt}`,
    '--------------------------------',
    ...sale.items.map(
      (item) =>
        `${item.description}  x${item.qty} @ AED ${item.unitPrice.toFixed(2)}  VAT ${item.vatAmount.toFixed(2)}  = AED ${item.lineTotal.toFixed(2)}`
    ),
    '--------------------------------',
    `Subtotal: AED ${sale.subtotal.toFixed(2)}`,
    `Discount: AED ${sale.discountAmount.toFixed(2)}`,
    `VAT (5%): AED ${sale.vatAmount.toFixed(2)}`,
    `Total: AED ${sale.total.toFixed(2)}`,
    `Payment: ${sale.paymentMethod}`
  ].filter((line): line is string => line !== null)
  return lines.join('\n')
}

/** Default in dev — logs to console, no hardware required. The renderer's ReceiptPreview shows the same data. */
class MockPrinter implements IReceiptPrinter {
  async printReceipt(sale: SaleWithItems): Promise<void> {
    console.log(`[MockPrinter]\n${formatReceiptText(sale, getSettings())}`)
  }

  async openDrawer(): Promise<void> {
    console.log('[MockPrinter] openDrawer() — no-op')
  }
}

/** Wraps node-thermal-printer (ESC/POS). Only instantiated when PRINTER_MODE=escpos is configured. */
class EscPosPrinter implements IReceiptPrinter {
  private printerInterface: string

  constructor(printerInterface: string) {
    this.printerInterface = printerInterface
  }

  private async withPrinter<T>(fn: (printer: import('node-thermal-printer').printer) => Promise<T>): Promise<T> {
    const { printer, types } = await import('node-thermal-printer')
    const instance = new printer({ type: types.EPSON, interface: this.printerInterface })
    return fn(instance)
  }

  async printReceipt(sale: SaleWithItems): Promise<void> {
    const settings = getSettings()
    await this.withPrinter(async (p) => {
      p.alignCenter()
      p.println(settings.shopName || 'RetailKey POS')
      if (settings.trn) p.println(`TRN: ${settings.trn}`)
      p.alignLeft()
      p.println(`Invoice: ${sale.invoiceNo}`)
      p.println(`Date: ${sale.createdAt}`)
      p.drawLine()
      for (const item of sale.items) {
        p.println(`${item.description}  x${item.qty} @ AED ${item.unitPrice.toFixed(2)}`)
        p.println(`  VAT ${item.vatAmount.toFixed(2)}  = AED ${item.lineTotal.toFixed(2)}`)
      }
      p.drawLine()
      p.println(`Subtotal: AED ${sale.subtotal.toFixed(2)}`)
      p.println(`Discount: AED ${sale.discountAmount.toFixed(2)}`)
      p.println(`VAT (5%): AED ${sale.vatAmount.toFixed(2)}`)
      p.bold(true)
      p.println(`Total: AED ${sale.total.toFixed(2)}`)
      p.bold(false)
      p.cut()
      await p.execute()
    })
  }

  async openDrawer(): Promise<void> {
    await this.withPrinter(async (p) => {
      p.openCashDrawer()
      await p.execute()
    })
  }
}

let printerInstance: IReceiptPrinter | null = null

export function getPrinter(): IReceiptPrinter {
  if (printerInstance) return printerInstance

  const mode = process.env.PRINTER_MODE ?? 'mock'
  if (mode === 'escpos' && process.env.PRINTER_INTERFACE) {
    printerInstance = new EscPosPrinter(process.env.PRINTER_INTERFACE)
  } else {
    printerInstance = new MockPrinter()
  }
  return printerInstance
}
