export const ROLES = ['admin', 'manager', 'cashier'] as const
export type Role = (typeof ROLES)[number]

export const VAT_RATE = 0.05

/** Max % a cashier may discount a single line or the whole bill before a manager override is required. */
export const CASHIER_MAX_DISCOUNT_PCT = 10

export type Permission =
  | 'products.read'
  | 'products.write'
  | 'metalRates.write'
  | 'purchases.read'
  | 'purchases.write'
  | 'sales.create'
  | 'sales.overridePrice'
  | 'sales.void'
  | 'reports.financial'
  | 'users.manage'
  | 'settings.write'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'products.read',
    'products.write',
    'metalRates.write',
    'purchases.read',
    'purchases.write',
    'sales.create',
    'sales.overridePrice',
    'sales.void',
    'reports.financial',
    'users.manage',
    'settings.write'
  ],
  manager: [
    'products.read',
    'products.write',
    'metalRates.write',
    'purchases.read',
    'purchases.write',
    'sales.create',
    'sales.overridePrice',
    'sales.void',
    'reports.financial'
  ],
  cashier: ['products.read', 'sales.create']
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const IDLE_LOGOUT_MS = 5 * 60 * 1000
