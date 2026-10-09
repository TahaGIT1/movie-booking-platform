export interface Showtime {
  id: string
  label: string
  price: number
}

export interface Theatre {
  id: string
  name: string
  location: string
  amenities: string[]
  showtimes: Showtime[]
}
