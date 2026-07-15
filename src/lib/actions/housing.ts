'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  housingListingSchema,
  roommateListingSchema,
  housingReviewSchema,
  type HousingListingInput,
  type RoommateListingInput,
  type HousingReviewInput,
} from '@/lib/validations/housing'
import type {
  HousingListing,
  HousingListingWithPoster,
  RoommateListing,
  RoommateListingWithPoster,
  HousingReviewWithReviewer,
} from '@/types/database'

// ─── HOUSING LISTINGS ────────────────────────────────────────────

export async function getHousingListings(filters?: {
  university?: string
  room_type?: string
  max_price?: number
}): Promise<HousingListingWithPoster[]> {
  const supabase = await createClient()
  let query = supabase
    .from('housing_listings')
    .select('*, profiles!housing_listings_poster_id_fkey(id, full_name, avatar_url, reputation_score, total_reviews)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('is_verified', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.university) query = query.ilike('university', `%${filters.university}%`)
  if (filters?.room_type) query = query.eq('room_type', filters.room_type)
  if (filters?.max_price) query = query.lte('price_per_year', filters.max_price)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as HousingListingWithPoster[]
}

export async function getHousingListingById(id: string): Promise<HousingListingWithPoster | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('housing_listings')
    .select('*, profiles!housing_listings_poster_id_fkey(id, full_name, avatar_url, reputation_score, total_reviews)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) return null
  return data as HousingListingWithPoster
}

export async function createHousingListing(input: HousingListingInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const validated = housingListingSchema.parse(input)

  const { data, error } = await supabase
    .from('housing_listings')
    .insert({ ...validated, poster_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/housing')
  return data as HousingListing
}

export async function updateHousingListing(id: string, input: Partial<HousingListingInput>) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('housing_listings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/housing/${id}`)
  revalidatePath('/housing/my-listings')
}

export async function deleteHousingListing(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('housing_listings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/housing/my-listings')
}

export async function incrementHousingViews(id: string) {
  const supabase = await createClient()
  await supabase.rpc('increment_housing_views', { listing_id: id })
}

export async function getMyHousingListings() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [hostels, roommates] = await Promise.all([
    supabase
      .from('housing_listings')
      .select('*')
      .eq('poster_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('roommate_listings')
      .select('*')
      .eq('poster_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  return {
    hostels: (hostels.data ?? []) as HousingListing[],
    roommates: (roommates.data ?? []) as RoommateListing[],
  }
}

// ─── ROOMMATE LISTINGS ───────────────────────────────────────────

export async function getRoommateListings(filters?: {
  university?: string
  preferred_gender?: string
  max_budget?: number
}): Promise<RoommateListingWithPoster[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('roommate_listings')
    .select('*, profiles!roommate_listings_poster_id_fkey(id, full_name, avatar_url)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.university) query = query.ilike('university', `%${filters.university}%`)
  if (filters?.preferred_gender && filters.preferred_gender !== 'any') {
    query = query.in('preferred_gender', [filters.preferred_gender, 'any'])
  }
  if (filters?.max_budget) query = query.lte('budget_per_year', filters.max_budget)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as RoommateListingWithPoster[]
}

export async function getRoommateListingById(id: string): Promise<RoommateListingWithPoster | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roommate_listings')
    .select('*, profiles!roommate_listings_poster_id_fkey(id, full_name, avatar_url)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) return null
  return data as RoommateListingWithPoster
}

export async function createRoommateListing(input: RoommateListingInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const validated = roommateListingSchema.parse(input)

  const { data, error } = await supabase
    .from('roommate_listings')
    .insert({ ...validated, poster_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/housing')
  return data as RoommateListing
}

export async function updateRoommateListing(id: string, input: Partial<RoommateListingInput>) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('roommate_listings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/housing/roommates/${id}`)
  revalidatePath('/housing/my-listings')
}

export async function deleteRoommateListing(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('roommate_listings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/housing/my-listings')
}

export async function markRoommateListingFilled(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('roommate_listings')
    .update({ status: 'filled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/housing/my-listings')
}

// ─── HOUSING REVIEWS ─────────────────────────────────────────────

export async function getHousingReviews(listingId: string): Promise<HousingReviewWithReviewer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('housing_reviews')
    .select('*, profiles!housing_reviews_reviewer_id_fkey(id, full_name, avatar_url)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as HousingReviewWithReviewer[]
}

export async function createHousingReview(input: HousingReviewInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const validated = housingReviewSchema.parse(input)

  const { error } = await supabase
    .from('housing_reviews')
    .insert({ ...validated, reviewer_id: user.id })

  if (error) {
    if (error.code === '23505') throw new Error('You have already reviewed this listing')
    throw new Error(error.message)
  }
  revalidatePath(`/housing/${input.listing_id}`)
}

// ─── ADMIN ───────────────────────────────────────────────────────

export async function getPendingHousingListings(): Promise<HousingListingWithPoster[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const { data, error } = await supabase
    .from('housing_listings')
    .select('*, profiles!housing_listings_poster_id_fkey(id, full_name, avatar_url, reputation_score, total_reviews)')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as HousingListingWithPoster[]
}

export async function approveHousingListing(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('housing_listings')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/housing')
  revalidatePath('/housing')
}

export async function rejectHousingListing(id: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('housing_listings')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/housing')
}

export async function verifyHousingListing(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('housing_listings')
    .update({ is_verified: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/housing')
  revalidatePath('/housing')
}