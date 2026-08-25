import { getDb } from '../index'
import type { Role } from '@shared/constants'

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
