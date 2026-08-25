import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import * as authService from '../services/auth.service'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

export function registerAuthHandlers(): void {
  ipcMain.handle(IPC.AUTH_LOGIN, (_event, payload) => {
    const { username, password } = loginSchema.parse(payload)
    return authService.login(username, password)
  })

  ipcMain.handle(IPC.AUTH_LOGOUT, () => {
    authService.logout()
  })

  ipcMain.handle(IPC.AUTH_CURRENT, () => {
    return authService.getCurrentUser()
  })
}
