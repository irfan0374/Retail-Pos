import type { Role } from '../constants'

export interface SafeUser {
  id: number
  name: string
  username: string
  role: Role
  isActive: boolean
}
