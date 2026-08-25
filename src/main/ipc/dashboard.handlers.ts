import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { getDashboardSummary, getSlowMovingProducts, getTopSellingProducts } from '../db/repositories/dashboard.repo'

export function registerDashboardHandlers(): void {
  ipcMain.handle(IPC.DASHBOARD_SUMMARY, () => {
    requirePermission('reports.financial')
    return getDashboardSummary()
  })

  ipcMain.handle(IPC.DASHBOARD_TOP_SELLING, () => {
    requirePermission('reports.financial')
    return getTopSellingProducts()
  })

  ipcMain.handle(IPC.DASHBOARD_SLOW_MOVING, () => {
    requirePermission('reports.financial')
    return getSlowMovingProducts()
  })
}
