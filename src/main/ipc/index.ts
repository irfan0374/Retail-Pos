import { registerAuthHandlers } from './auth.handlers'
import { registerProductHandlers } from './products.handlers'
import { registerMetalRateHandlers } from './metalRates.handlers'
import { registerCustomerHandlers } from './customers.handlers'
import { registerSalesHandlers } from './sales.handlers'
import { registerSupplierHandlers } from './suppliers.handlers'
import { registerPurchaseHandlers } from './purchases.handlers'
import { registerReportHandlers } from './reports.handlers'
import { registerSettingsHandlers } from './settings.handlers'

export function registerIpcHandlers(): void {
  registerAuthHandlers()
  registerProductHandlers()
  registerMetalRateHandlers()
  registerCustomerHandlers()
  registerSalesHandlers()
  registerSupplierHandlers()
  registerPurchaseHandlers()
  registerReportHandlers()
  registerSettingsHandlers()
}
