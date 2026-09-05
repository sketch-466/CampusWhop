'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { opportunitySchema, type OpportunityInput } from '@/lib/validations/opportunities'
import type { Opportunity, OpportunityWithPoster } from '@/types/database'

export async function getOpportunities(filters?: {
  category?: string
}): Promise<OpportunityWithPoster[]> {
  const supabase = await createClient()
  await supabase.rpc('expire_past_opportunities')

  let query = supabase
    .from('opportunities')
    .select('*, profiles!opportunities_poster_id_fkey(id, full_name, avatar_url)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters?.category) query = query.eq('category', filters.category)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as OpportunityWithPoster[]
}

export async function getOpportunityById(id: string): Promise<OpportunityWithPoster | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, profiles!opportunities_poster_id_fkey(id, full_name, avatar_url)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) return null
  return data as OpportunityWithPoster
}

export async function incrementOpportunityViews(id: string) {
  const supabase = await createClient()
  await supabase.rpc('increment_opportunity_views', { opportunity_id: id })
}

export async function createOpportunity(input: OpportunityInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const validated = opportunitySchema.parse(input)

  const { data, error } = await supabase
    .from('opportunities')
    .insert({ ...validated, poster_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/opportunities')
  return data as Opportunity
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('opportunities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('poster_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/opportunities')
}

export async function getMyOpportunities(): Promise<Opportunity[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('poster_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Opportunity[]
}

export async function getSavedOpportunities(): Promise<OpportunityWithPoster[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('opportunity_id, opportunities(*, profiles!opportunities_poster_id_fkey(id, full_name, avatar_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((d: any) => d.opportunities).filter(Boolean) as OpportunityWithPoster[]
}

export async function saveOpportunity(opportunityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('saved_opportunities')
    .insert({ user_id: user.id, opportunity_id: opportunityId })

  if (error && error.code !== '23505') throw new Error(error.message)
  revalidatePath(`/opportunities/${opportunityId}`)
  revalidatePath('/opportunities/saved')
}

export async function unsaveOpportunity(opportunityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunityId)

  if (error) throw new Error(error.message)
  revalidatePath(`/opportunities/${opportunityId}`)
  revalidatePath('/opportunities/saved')
}

export async function checkIfSaved(opportunityId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('saved_opportunities')
    .select('id')
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  return !!data
}

export async function getPendingOpportunities(): Promise<OpportunityWithPoster[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('opportunities')
    .select('*, profiles!opportunities_poster_id_fkey(id, full_name, avatar_url)')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as OpportunityWithPoster[]
}

export async function approveOpportunity(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('opportunities')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/opportunities')
  revalidatePath('/opportunities')
}

export async function rejectOpportunity(id: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('opportunities')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/opportunities')
}