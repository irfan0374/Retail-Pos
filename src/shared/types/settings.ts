export interface ShopSettings {
  shopName: string
  trn: string
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
