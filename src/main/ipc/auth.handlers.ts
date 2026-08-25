import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { requireSession } from '../services/auth.service'
import * as authService from '../services/auth.service'

const PIN_SCHEMA = z.string().regex(/^\d{4}$/, 'PIN must be 4 digits')

const loginSchema = z.object({ pin: PIN_SCHEMA })
const changeOwnPinSchema = z.object({ currentPin: PIN_SCHEMA, newPin: PIN_SCHEMA })

export function registerAuthHandlers(): void {
  ipcMain.handle(IPC.AUTH_LOGIN, (_event, payload) => {
    const { pin } = loginSchema.parse(payload)
    return authService.login(pin)
  })

  ipcMain.handle(IPC.AUTH_LOGOUT, () => {
    authService.logout()
  })

  ipcMain.handle(IPC.AUTH_CURRENT, () => {
    return authService.getCurrentUser()
  })

  ipcMain.handle(IPC.AUTH_CHANGE_OWN_PIN, (_event, payload) => {
    const user = requireSession()
    const { currentPin, newPin } = changeOwnPinSchema.parse(payload)
    authService.changeOwnPin(user.id, currentPin, newPin)
  })
}
