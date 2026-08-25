import type { ReactNode } from 'react'
import { can, type Permission } from '@shared/constants'
import { useAuthStore } from '../store/authStore'

/** Cosmetic only — hides/disables controls the current role shouldn't see. The main process re-checks every action. */
export function RoleGate({ permission, children }: { permission: Permission; children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user || !can(user.role, permission)) return null
  return <>{children}</>
}
