import type { Coupon } from '../types/booking'

// Temporary UI rules. Replace with server-side coupon validation when available.
export const mockCoupons: Coupon[] = [
  { code: 'CINE10', label: '10% off', kind: 'percent', value: 10 },
  { code: 'WELCOME50', label: '₹50 off', kind: 'fixed', value: 50 },
]
