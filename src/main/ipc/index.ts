import { registerAuthHandlers } from './auth.handlers'
import { registerProductHandlers } from './products.handlers'
import { registerMetalRateHandlers } from './metalRates.handlers'
import { registerCustomerHandlers } from './customers.handlers'
import { registerSalesHandlers } from './sales.handlers'

export function registerIpcHandlers(): void {
  registerAuthHandlers()
  registerProductHandlers()
  registerMetalRateHandlers()
  registerCustomerHandlers()
  registerSalesHandlers()
}
