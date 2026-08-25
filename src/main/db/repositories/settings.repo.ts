import { getDb } from '../index'
import type { BackupSettings, ShopSettings } from '@shared/types/settings'

interface SettingsRow {
  shop_name: string
  trn: string
  address: string
  phone: string
  idle_logout_minutes: number
  show_old_gold_exchange: number
  show_returns: number
  show_metal_rates: number
  backup_dir: string | null
  last_backup_at: string | null
}

function getRow(): SettingsRow {
  return getDb().prepare('SELECT * FROM app_settings WHERE id = 1').get() as SettingsRow
}

export function getSettings(): ShopSettings {
  const row = getRow()
  return {
    shopName: row.shop_name,
    trn: row.trn,
    address: row.address,
    phone: row.phone,
    idleLogoutMinutes: row.idle_logout_minutes,
    showOldGoldExchange: !!row.show_old_gold_exchange,
    showReturns: !!row.show_returns,
    showMetalRates: !!row.show_metal_rates
  }
}

export function updateSettings(input: ShopSettings): ShopSettings {
  getDb()
    .prepare(
      `UPDATE app_settings SET
        shop_name = ?, trn = ?, address = ?, phone = ?, idle_logout_minutes = ?,
        show_old_gold_exchange = ?, show_returns = ?, show_metal_rates = ?
      WHERE id = 1`
    )
    .run(
      input.shopName,
      input.trn,
      input.address,
      input.phone,
      input.idleLogoutMinutes,
      input.showOldGoldExchange ? 1 : 0,
      input.showReturns ? 1 : 0,
      input.showMetalRates ? 1 : 0
    )
  return getSettings()
}

export function getBackupSettings(): BackupSettings {
  const row = getRow()
  return { backupDir: row.backup_dir, lastBackupAt: row.last_backup_at }
}

export function setBackupDir(backupDir: string | null): BackupSettings {
  getDb().prepare('UPDATE app_settings SET backup_dir = ? WHERE id = 1').run(backupDir)
  return getBackupSettings()
}

export function recordBackupCompleted(): void {
  getDb().prepare(`UPDATE app_settings SET last_backup_at = datetime('now') WHERE id = 1`).run()
}
