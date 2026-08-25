export interface ShopSettings {
  shopName: string
  trn: string
  address: string
  phone: string
  idleLogoutMinutes: number
  showOldGoldExchange: boolean
  showReturns: boolean
  showMetalRates: boolean
}

export interface BackupSettings {
  backupDir: string | null
  lastBackupAt: string | null
}

export interface BackupFileInfo {
  name: string
  sizeBytes: number
  createdAt: string
}
