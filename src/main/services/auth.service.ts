import bcrypt from 'bcryptjs'
import { findUserById, listActiveUserRows, updatePasswordHash, type UserRow } from '../db/repositories/users.repo'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import type { SafeUser } from '@shared/types/user'

let currentSession: SafeUser | null = null

function toSafeUser(row: { id: number; name: string; username: string; role: SafeUser['role']; is_active: number }): SafeUser {
  return { id: row.id, name: row.name, username: row.username, role: row.role, isActive: !!row.is_active }
}

/** No username at login — the PIN itself identifies the user, so every active user's hash is checked. */
function findUserByPin(pin: string, roleFilter?: SafeUser['role'][]): UserRow | null {
  const candidates = listActiveUserRows().filter((row) => !roleFilter || roleFilter.includes(row.role))
  for (const row of candidates) {
    if (bcrypt.compareSync(pin, row.password_hash)) return row
  }
  return null
}

export function login(pin: string): SafeUser {
  const row = findUserByPin(pin)

  if (!row) {
    recordAuditLog({ userId: null, action: 'auth.login_failed' })
    throw new Error('Incorrect PIN')
  }

  const user = toSafeUser(row)
  currentSession = user
  recordAuditLog({ userId: user.id, action: 'auth.login' })
  return user
}

export function logout(): void {
  if (currentSession) {
    recordAuditLog({ userId: currentSession.id, action: 'auth.logout' })
  }
  currentSession = null
}

export function getCurrentUser(): SafeUser | null {
  return currentSession
}

/** Throws if nobody is logged in — call at the top of any IPC handler that requires auth. */
export function requireSession(): SafeUser {
  if (!currentSession) throw new Error('Not authenticated')
  return currentSession
}

/**
 * Verifies a manager/admin's PIN without changing the active session — used for in-line discount
 * overrides at checkout, where the cashier stays logged in.
 */
export function verifyManagerPin(pin: string): SafeUser {
  const row = findUserByPin(pin, ['manager', 'admin'])
  if (!row) throw new Error('Invalid manager PIN')
  return toSafeUser(row)
}

/** Self-service PIN change — requires knowing the current PIN. */
export function changeOwnPin(userId: number, currentPin: string, newPin: string): void {
  const row = findUserById(userId)
  if (!row || !bcrypt.compareSync(currentPin, row.password_hash)) {
    throw new Error('Current PIN is incorrect')
  }
  updatePasswordHash(userId, bcrypt.hashSync(newPin, 10))
}

/** Admin-only — resets another user's PIN without needing to know the old one. */
export function resetUserPin(userId: number, newPin: string): void {
  updatePasswordHash(userId, bcrypt.hashSync(newPin, 10))
}
