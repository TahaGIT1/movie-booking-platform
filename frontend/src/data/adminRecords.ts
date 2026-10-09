export type AdminAccountStatus = 'active' | 'suspended'
export type TheatreApprovalStatus = 'approved' | 'pending' | 'rejected'

export interface MockAdminUser { id: string; name: string; email: string; role: string; status: AdminAccountStatus; registeredAt: string }
export interface MockAdminTheatre { id: string; name: string; location: string; manager: string; screens: number; status: TheatreApprovalStatus }

// Temporary administration fixtures only. These are not database records.
export const mockAdminUsers: MockAdminUser[] = [
  { id: 'user-1', name: 'Aarav Mehta', email: 'aarav.mehta@example.com', role: 'Customer', status: 'active', registeredAt: '2026-08-14' },
  { id: 'user-2', name: 'Priya Nair', email: 'priya.nair@example.com', role: 'Theatre Manager', status: 'active', registeredAt: '2026-07-29' },
  { id: 'user-3', name: 'Rohan Shah', email: 'rohan.shah@example.com', role: 'Staff', status: 'suspended', registeredAt: '2026-06-18' },
]

export const mockAdminTheatres: MockAdminTheatre[] = [
  { id: 'luxe-central', name: 'CineVerse Luxe', location: 'Indiranagar, Bengaluru', manager: 'Priya Nair', screens: 5, status: 'approved' },
  { id: 'skyline-mall', name: 'Skyline Cinemas', location: 'Koramangala, Bengaluru', manager: 'Vikram Rao', screens: 7, status: 'pending' },
  { id: 'metroplex', name: 'Metroplex PVR', location: 'Whitefield, Bengaluru', manager: 'Ananya Iyer', screens: 4, status: 'rejected' },
]
