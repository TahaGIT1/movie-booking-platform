export interface Coupon { code: string; label: string; kind: 'percent' | 'fixed'; value: number }

export interface BookingSummary { movieId: string; theatreId: string; showtimeId: string; date: string; seats: string[] }
