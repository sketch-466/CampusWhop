// ─── HOUSING ─────────────────────────────────────────────────────

export type HousingListing = {
  id: string
  poster_id: string
  poster_type: 'landlord' | 'agent' | 'student'
  title: string
  description: string
  location: string
  university: string
  price_per_year: number
  room_type: 'self_con' | 'shared_room' | 'mini_flat' | 'flat' | 'duplex'
  amenities: string[]
  images: string[]
  available_rooms: number
  whatsapp_number: string
  status: 'pending' | 'active' | 'rejected' | 'inactive'
  is_verified: boolean
  rejection_reason: string | null
  views_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type HousingListingWithPoster = HousingListing & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'reputation_score' | 'total_reviews'>
}

export type RoommateListing = {
  id: string
  poster_id: string
  title: string
  description: string
  location: string
  university: string
  budget_per_year: number
  preferred_gender: 'male' | 'female' | 'any'
  move_in_date: string
  whatsapp_number: string
  status: 'active' | 'filled' | 'expired'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type RoommateListingWithPoster = RoommateListing & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export type HousingReview = {
  id: string
  listing_id: string
  reviewer_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export type HousingReviewWithReviewer = HousingReview & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}