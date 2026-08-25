import { can, type Permission } from '@shared/constants'
import { requireSession } from './services/auth.service'
import type { SafeUser } from '@shared/types/user'

/** Requires an active session AND that role to hold `permission`. Sole authority — renderer-side gating is cosmetic only. */
export function requirePermission(permission: Permission): SafeUser {
  const user = requireSession()
  if (!can(user.role, permission)) {
    throw new Error(`Role "${user.role}" lacks permission "${permission}"`)
  }
  return user
}
