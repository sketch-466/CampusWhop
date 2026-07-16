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
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
    reputation_score: number
    total_reviews: number
  }
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
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
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
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}


// ─── STORE ORDERS ─────────────────────────────────────────────────

export type StoreOrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled'

export type StoreOrder = {
  id: string
  listing_id: string | null
  store_id: string | null
  store_product_id: string | null
  buyer_id: string
  seller_id: string
  amount: number
  platform_fee: number
  seller_amount: number
  status: StoreOrderStatus
  paystack_reference: string | null
  paystack_transfer_code: string | null
  digital_file_url: string | null
  shipped_at: string | null
  delivery_confirmed_at: string | null
  completed_at: string | null
  disputed_at: string | null
  created_at: string
  updated_at: string
}

export type StoreOrderWithDetails = StoreOrder & {
  store_products: {
    id: string
    title: string
    images: string[]
    product_type: string
  } | null
  stores: {
    id: string
    store_name: string
    slug: string
    logo_url: string | null
  } | null
  buyer: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  seller: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}