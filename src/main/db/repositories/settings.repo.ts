import { getDb } from '../index'
import type { ShopSettings } from '@shared/types/settings'

interface SettingsRow {
  shop_name: string
  trn: string
}

export function getSettings(): ShopSettings {
  const row = getDb().prepare('SELECT shop_name, trn FROM app_settings WHERE id = 1').get() as SettingsRow
  return { shopName: row.shop_name, trn: row.trn }
}

export function updateSettings(input: ShopSettings): ShopSettings {
  getDb()
    .prepare('UPDATE app_settings SET shop_name = ?, trn = ? WHERE id = 1')
    .run(input.shopName, input.trn)
  return getSettings()
}
