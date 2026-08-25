import { getDb } from '../index'
import type { Role } from '@shared/constants'
import type { SafeUser } from '@shared/types/user'

export interface UserRow {
  id: number
  name: string
  username: string
  password_hash: string
  role: Role
  is_active: number
}

export function findUserByUsername(username: string): UserRow | undefined {
  return getDb()
    .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
    .get(username) as UserRow | undefined
}

export function findUserById(id: number): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

/** Internal — includes the password/PIN hash, for PIN-matching during login. Never exposed via IPC. */
export function listActiveUserRows(): UserRow[] {
  return getDb().prepare('SELECT * FROM users WHERE is_active = 1').all() as UserRow[]
}

export function updatePasswordHash(userId: number, passwordHash: string): void {
  getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId)
}

/** For report filter dropdowns (e.g. "filter sales by cashier") — no password hash included. */
export function listUsers(): SafeUser[] {
  const rows = getDb().prepare('SELECT * FROM users ORDER BY name').all() as UserRow[]
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    isActive: !!row.is_active
  }))
}
