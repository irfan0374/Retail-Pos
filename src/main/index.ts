import { app, BrowserWindow } from 'electron'
import { initDatabase } from './db'
import { registerIpcHandlers } from './ipc'
import { createMainWindow } from './window'
import { runBackupIfDue } from './services/backup.service'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    initDatabase()
    registerIpcHandlers()
    createMainWindow()
    void runBackupIfDue()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
