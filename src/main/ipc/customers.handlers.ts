import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requireSession } from '../services/auth.service'
import { createCustomer, searchCustomers } from '../db/repositories/customers.repo'

const newCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullable(),
  trn: z.string().nullable()
})

export function registerCustomerHandlers(): void {
  ipcMain.handle(IPC.CUSTOMERS_SEARCH, (_event, query) => {
    requireSession()
    return searchCustomers(String(query ?? ''))
  })

  ipcMain.handle(IPC.CUSTOMERS_CREATE, (_event, payload) => {
    requireSession()
    const input = newCustomerSchema.parse(payload)
    return createCustomer(input)
  })
}
