export type UserRole = 'customer' | 'manager' | 'staff' | 'admin'
export interface AuthenticatedUser { id: string; name: string; role: UserRole }

// Central auth seam for future API/session integration. There is no real frontend session yet.
export function isAuthenticated() {
  return false
}

export function getCurrentUser(): AuthenticatedUser | null {
  return null
}

export function getRoleHome(role: UserRole) {
  return role === 'customer' ? '/' : `/${role}`
}
