import bcrypt from 'bcryptjs'
import { findUserById, listActiveUserRows, updatePasswordHash, type UserRow } from '../db/repositories/users.repo'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import type { SafeUser } from '@shared/types/user'

let currentSession: SafeUser | null = null

function toSafeUser(row: { id: number; name: string; username: string; role: SafeUser['role']; is_active: number }): SafeUser {
  return { id: row.id, name: row.name, username: row.username, role: row.role, isActive: !!row.is_active }
}

/**
 * PIN attempts (login, manager override, own-PIN change) share one lockout: MAX_PIN_ATTEMPTS
 * failures within PIN_WINDOW_MS lock PIN entry for a period that doubles with each lockout in the
 * window (capped). A successful PIN deliberately does not clear the count — otherwise a cashier
 * could interleave their own PIN between guesses at a manager's 4-digit PIN.
 */
const MAX_PIN_ATTEMPTS = 5
const PIN_WINDOW_MS = 60 * 60_000
const BASE_LOCKOUT_MS = 30_000
const MAX_LOCKOUT_MS = 15 * 60_000
let pinFailures: number[] = []
let pinLockouts: number[] = []
let lockedUntil = 0

function assertNotLockedOut(): void {
  const remainingMs = lockedUntil - Date.now()
  if (remainingMs > 0) {
    throw new Error(`Too many incorrect PINs — try again in ${Math.ceil(remainingMs / 1000)} seconds`)
  }
}

function recordPinFailure(): void {
  const now = Date.now()
  pinFailures = pinFailures.filter((t) => now - t < PIN_WINDOW_MS)
  pinLockouts = pinLockouts.filter((t) => now - t < PIN_WINDOW_MS)
  pinFailures.push(now)
  if (pinFailures.length >= MAX_PIN_ATTEMPTS) {
    lockedUntil = now + Math.min(BASE_LOCKOUT_MS * 2 ** pinLockouts.length, MAX_LOCKOUT_MS)
    pinLockouts.push(now)
    pinFailures = []
    recordAuditLog({ userId: currentSession?.id ?? null, action: 'auth.pin_lockout' })
  }
}

/** No username at login — the PIN itself identifies the user, so every active user's hash is checked. */
function findUsersByPin(pin: string, exceptUserId?: number): UserRow[] {
  return listActiveUserRows().filter(
    (row) => row.id !== exceptUserId && bcrypt.compareSync(pin, row.password_hash)
  )
}

/**
 * Resolves a PIN to exactly one user. A PIN shared by several users (only possible from data that
 * predates the uniqueness check) is refused rather than guessing which person is at the counter.
 */
function resolveUserByPin(pin: string): UserRow | null {
  assertNotLockedOut()
  const matches = findUsersByPin(pin)
  if (matches.length === 0) {
    recordPinFailure()
    return null
  }
  if (matches.length > 1) {
    recordAuditLog({ userId: null, action: 'auth.pin_conflict', details: { userIds: matches.map((m) => m.id) } })
    throw new Error('This PIN is assigned to more than one user — ask an admin to reset it')
  }
  return matches[0]
}

/** Every user's PIN must be unique, since the PIN alone identifies who is logging in. */
function assertPinAvailable(pin: string, userId: number): void {
  if (findUsersByPin(pin, userId).length > 0) {
    throw new Error('That PIN is not available — choose a different one')
  }
}

export function login(pin: string): SafeUser {
  const row = resolveUserByPin(pin)

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
  const row = resolveUserByPin(pin)
  if (!row || (row.role !== 'manager' && row.role !== 'admin')) {
    // A non-manager's PIN is just as much a failed override attempt as an unknown one.
    if (row) recordPinFailure()
    recordAuditLog({ userId: currentSession?.id ?? null, action: 'checkout.override_pin_failed' })
    throw new Error('Invalid manager PIN')
  }
  return toSafeUser(row)
}

/** Self-service PIN change — requires knowing the current PIN. */
export function changeOwnPin(userId: number, currentPin: string, newPin: string): void {
  assertNotLockedOut()
  const row = findUserById(userId)
  if (!row || !bcrypt.compareSync(currentPin, row.password_hash)) {
    recordPinFailure()
    throw new Error('Current PIN is incorrect')
  }
  try {
    assertPinAvailable(newPin, userId)
  } catch (err) {
    // A collision reveals that someone else uses this PIN, so it counts toward the lockout too.
    recordPinFailure()
    throw err
  }
  updatePasswordHash(userId, bcrypt.hashSync(newPin, 10))
}

/** Admin-only — resets another user's PIN without needing to know the old one. */
export function resetUserPin(userId: number, newPin: string): void {
  assertPinAvailable(newPin, userId)
  updatePasswordHash(userId, bcrypt.hashSync(newPin, 10))
}
