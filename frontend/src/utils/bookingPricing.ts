import type { Coupon } from '../types/booking'

export function calculateDiscount(subtotal: number, coupon?: Coupon) { if (!coupon) return 0; return coupon.kind === 'percent' ? Math.round(subtotal * coupon.value / 100) : Math.min(subtotal, coupon.value) }
export function calculateTotal(subtotal: number, discount: number) { return Math.max(0, subtotal - discount) }
