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

// ─── OPPORTUNITIES ────────────────────────────────────────────────

export type OpportunityCategory = 'scholarship' | 'internship' | 'grant' | 'competition'
export type OpportunityStatus = 'pending' | 'active' | 'rejected' | 'expired'

export type Opportunity = {
  id: string
  poster_id: string
  title: string
  description: string
  category: OpportunityCategory
  organization: string
  location: string | null
  is_remote: boolean
  apply_url: string
  deadline: string | null
  eligibility: string | null
  amount: string | null
  status: OpportunityStatus
  rejection_reason: string | null
  views_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type OpportunityWithPoster = Opportunity & {
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export type SavedOpportunity = {
  id: string
  user_id: string
  opportunity_id: string
  created_at: string
}