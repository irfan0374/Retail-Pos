import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc-contract'
import { requirePermission } from '../permissions'
import { getBackupSettings } from '../db/repositories/settings.repo'
import { listBackupFiles, performBackup, pickBackupDirectory } from '../services/backup.service'

export function registerBackupHandlers(): void {
  ipcMain.handle(IPC.BACKUPS_GET_SETTINGS, () => {
    requirePermission('settings.write')
    return getBackupSettings()
  })

  ipcMain.handle(IPC.BACKUPS_PICK_DIRECTORY, () => {
    requirePermission('settings.write')
    return pickBackupDirectory()
  })

  ipcMain.handle(IPC.BACKUPS_RUN_NOW, () => {
    requirePermission('settings.write')
    return performBackup()
  })

  ipcMain.handle(IPC.BACKUPS_LIST_FILES, () => {
    requirePermission('settings.write')
    return listBackupFiles()
  })
}
