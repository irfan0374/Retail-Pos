import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BackupFileInfo, BackupSettings } from '@shared/types/settings'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BackupsSection() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<BackupSettings | null>(null)
  const [files, setFiles] = useState<BackupFileInfo[]>([])
  const [running, setRunning] = useState(false)

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([window.api.backups.getSettings(), window.api.backups.listFiles()])
    setSettings(s)
    setFiles(f)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handlePickFolder() {
    const s = await window.api.backups.pickDirectory()
    setSettings(s)
    void load()
  }

  async function handleBackupNow() {
    setRunning(true)
    try {
      await window.api.backups.runNow()
      await load()
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mt-6 max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700">{t('settings.backupsTitle')}</h2>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{t('settings.backupFolder')}</span>
        <span className="max-w-[60%] truncate text-right" title={settings?.backupDir ?? ''}>
          {settings?.backupDir ?? t('settings.noBackupFolder')}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{t('settings.lastBackup')}</span>
        <span>{settings?.lastBackupAt ?? t('settings.never')}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => void handlePickFolder()} className="btn-secondary flex-1 text-sm">
          {t('settings.chooseFolder')}
        </button>
        <button
          onClick={() => void handleBackupNow()}
          disabled={!settings?.backupDir || running}
          className="btn-primary flex-1 text-sm"
        >
          {t('settings.backupNow')}
        </button>
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('settings.backupFiles')}</h3>
        <div className="max-h-40 overflow-auto rounded-md border border-slate-200">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              {files.map((f) => (
                <tr key={f.name}>
                  <td className="px-2 py-1 font-mono">{f.name}</td>
                  <td className="px-2 py-1 text-right text-slate-400">{formatBytes(f.sizeBytes)}</td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td className="px-2 py-3 text-center text-slate-400">{t('settings.noBackupFiles')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">{t('settings.backupNote')}</p>
    </div>
  )
}
