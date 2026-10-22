import type { Role } from '@/data/fixtures'

/**
 * Role → module access matrix.
 *
 * In this prototype the matrix only shapes the UI (which navigation items and
 * records are shown for the previewed role). It is NOT a security boundary:
 * once authentication lands, the same matrix must be enforced server-side on
 * every data endpoint before records leave the server (see PLAN.md).
 */
export type ModuleKey =
  | 'dashboard'
  | 'rooms'
  | 'checkins'
  | 'maintenance'
  | 'inspections'
  | 'complaints'
  | 'transfers'
  | 'tasks'
  | 'reports'
  | 'settings'

export const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  reception: 'Reception Staff',
  maintenance: 'Maintenance Staff',
  cleaning: 'Cleaning Staff',
}

const access: Record<Role, ModuleKey[]> = {
  admin: ['dashboard', 'rooms', 'checkins', 'maintenance', 'inspections', 'complaints', 'transfers', 'tasks', 'reports', 'settings'],
  manager: ['dashboard', 'rooms', 'checkins', 'maintenance', 'inspections', 'complaints', 'transfers', 'tasks', 'reports'],
  reception: ['dashboard', 'rooms', 'checkins', 'maintenance', 'inspections', 'complaints', 'transfers', 'tasks'],
  maintenance: ['dashboard', 'maintenance', 'tasks'],
  cleaning: ['dashboard', 'inspections', 'tasks'],
}

export function canAccess(role: Role, module: ModuleKey) {
  return access[role].includes(module)
}

/** Maintenance and cleaning staff only see work assigned to them. */
export function seesOnlyOwnWork(role: Role) {
  return role === 'maintenance' || role === 'cleaning'
}

/** Sensitive complaint details are limited to managers and administrators. */
export function canViewSensitive(role: Role) {
  return role === 'admin' || role === 'manager'
}
