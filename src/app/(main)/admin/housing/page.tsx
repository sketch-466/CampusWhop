import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { approveHousingListing, rejectHousingListing } from '@/lib/actions/housing'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, ArrowLeft, Home } from 'lucide-react'

export default async function AdminHousingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const { data: listings, error } = await supabase
    .from('housing_listings')
    .select(
      `
      *,
      poster:profiles(full_name, email, university)
    `
    )
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin housing fetch error:', error)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/listings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Home className="h-6 w-6 text-emerald-500" />
          Housing Approvals
        </h1>
        <Badge
          variant="outline"
          className="border-amber-800 bg-amber-900/20 text-amber-400"
        >
          {listings?.length || 0} Pending
        </Badge>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <Home className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No pending housing listings.</p>
          <p className="text-xs text-zinc-500 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: any) => (
            <HousingApprovalCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

// Separate server component for each card to handle form actions properly
async function HousingApprovalCard({ listing }: { listing: any }) {
  async function handleApprove() {
    'use server'
    await approveHousingListing(listing.id)
  }

  async function handleReject() {
    'use server'
    await rejectHousingListing(listing.id, 'Does not meet posting guidelines')
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white">{listing.title}</h3>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="outline" className="text-xs">
              {listing.listing_type}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {listing.location_area} · {listing.poster?.university || 'Unknown'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            by {listing.poster?.full_name || 'Unknown'} ·{' '}
            {listing.poster?.email || ''}
          </p>
          <div className="mt-2 rounded-lg bg-zinc-900/50 p-2">
            <p className="text-xs text-zinc-400 line-clamp-2">
              {listing.description}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
            <span>Type: {listing.poster_role || 'Unknown'}</span>
            {listing.price && (
              <span className="text-emerald-400">
                ₦{listing.price.toLocaleString()}
                {listing.price_period && `/${listing.price_period}`}
              </span>
            )}
            {listing.budget_min && listing.budget_max && (
              <span className="text-emerald-400">
                ₦{listing.budget_min.toLocaleString
