import bcrypt from 'bcryptjs'
import { findUserByUsername } from '../db/repositories/users.repo'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import type { SafeUser } from '@shared/types/user'

let currentSession: SafeUser | null = null

function toSafeUser(row: { id: number; name: string; username: string; role: SafeUser['role']; is_active: number }): SafeUser {
  return { id: row.id, name: row.name, username: row.username, role: row.role, isActive: !!row.is_active }
}

export function login(username: string, password: string): SafeUser {
  const row = findUserByUsername(username)
  const passwordOk = row ? bcrypt.compareSync(password, row.password_hash) : false

  if (!row || !passwordOk) {
    recordAuditLog({ userId: row?.id ?? null, action: 'auth.login_failed', details: { username } })
    throw new Error('Invalid username or password')
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
 * Verifies a manager/admin's credentials without changing the active session — used for
 * in-line discount overrides at checkout, where the cashier stays logged in.
 */
export function verifyManagerCredentials(username: string, password: string): SafeUser {
  const row = findUserByUsername(username)
  if (!row || !row.is_active || (row.role !== 'manager' && row.role !== 'admin')) {
    throw new Error('Override user is not an active manager or admin')
  }
  if (!bcrypt.compareSync(password, row.password_hash)) {
    throw new Error('Invalid manager credentials')
  }
  return toSafeUser(row)
}
