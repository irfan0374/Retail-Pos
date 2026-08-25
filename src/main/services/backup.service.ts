import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { getDb, getDbPath } from '../db'
import { getBackupSettings, recordBackupCompleted, setBackupDir } from '../db/repositories/settings.repo'
import type { BackupFileInfo, BackupSettings } from '@shared/types/settings'

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000
const BACKUP_FILE_PREFIX = 'retailkey-pos-backup-'

function backupFileName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${BACKUP_FILE_PREFIX}${stamp}.db`
}

/** SQLite's `datetime('now')` format has no timezone marker — it's always UTC, so reparse it as such. */
function parseSqliteUtc(value: string): number {
  return new Date(`${value.replace(' ', 'T')}Z`).getTime()
}

export async function pickBackupDirectory(): Promise<BackupSettings> {
  const win = BrowserWindow.getFocusedWindow()
  const options: OpenDialogOptions = {
    title: 'Choose Backup Folder',
    properties: ['openDirectory', 'createDirectory']
  }
  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
  if (result.canceled || result.filePaths.length === 0) return getBackupSettings()
  return setBackupDir(result.filePaths[0])
}

export async function performBackup(): Promise<BackupSettings> {
  const settings = getBackupSettings()
  if (!settings.backupDir) throw new Error('No backup folder configured')

  // Flush the WAL into the main file so a plain file copy is a complete, consistent snapshot.
  getDb().pragma('wal_checkpoint(TRUNCATE)')

  const destination = join(settings.backupDir, backupFileName())
  await fs.copyFile(getDbPath(), destination)
  recordBackupCompleted()
  return getBackupSettings()
}

/** Called once at app startup — backs up automatically if a folder is configured and it's been >24h. */
export async function runBackupIfDue(): Promise<void> {
  const settings = getBackupSettings()
  if (!settings.backupDir) return
  const lastBackupMs = settings.lastBackupAt ? parseSqliteUtc(settings.lastBackupAt) : 0
  if (Date.now() - lastBackupMs < BACKUP_INTERVAL_MS) return
  try {
    await performBackup()
  } catch (err) {
    console.error('[backup] automatic backup failed:', err)
  }
}

export async function listBackupFiles(): Promise<BackupFileInfo[]> {
  const backupDir = getBackupSettings().backupDir
  if (!backupDir) return []
  try {
    const entries = await fs.readdir(backupDir)
    const files = await Promise.all(
      entries
        .filter((name) => name.startsWith(BACKUP_FILE_PREFIX) && name.endsWith('.db'))
        .map(async (name) => {
          const stat = await fs.stat(join(backupDir, name))
          return { name, sizeBytes: stat.size, createdAt: stat.birthtime.toISOString() }
        })
    )
    return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return []
  }
}
