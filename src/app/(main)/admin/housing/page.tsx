import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getPendingHousingListings,
  approveHousingListing,
  rejectHousingListing,
  verifyHousingListing,
} from '@/lib/actions/housing'
import type { HousingListingWithPoster } from '@/types/database'

const ROOM_TYPE_LABELS: Record<string, string> = {
  self_con: 'Self-Contained',
  shared_room: 'Shared Room',
  mini_flat: 'Mini Flat',
  flat: 'Flat',
  duplex: 'Duplex',
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: '📶 WiFi',
  water: '💧 Running Water',
  generator: '⚡ Generator',
  security: '🔒 Security',
  parking: '🚗 Parking',
  kitchen: '🍳 Kitchen',
  bathroom_ensuite: '🚿 Ensuite Bathroom',
  fence: '🏠 Fenced Compound',
  borehole: '🪣 Borehole',
}

export default async function AdminHousingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const pending = await getPendingHousingListings()

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <h1 className="text-lg font-bold text-zinc-100">Housing Review Queue</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          {pending.length} listing{pending.length !== 1 ? 's' : ''} pending review
        </p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">✅</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">
              All caught up
            </h3>
            <p className="text-xs text-zinc-500">
              No housing listings pending review
            </p>
          </div>
        ) : (
          pending.map((listing) => (
            <AdminHousingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  )
}

function AdminHousingCard({ listing }: { listing: HousingListingWithPoster }) {
  const postedDate = new Date(listing.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {/* Images */}
      {listing.images.length > 0 && (
        <div className="flex gap-1 overflow-x-auto p-2">
          {listing.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Photo ${i + 1}`}
              className="h-24 w-32 flex-shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Title + meta */}
        <div>
          <h3 className="text-sm font-bold text-zinc-100">{listing.title}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 capitalize">
              {listing.poster_type}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              ₦{listing.price_per_year.toLocaleString()}/yr
            </span>
          </div>
        </div>

        {/* Location + university */}
        <div className="space-y-0.5">
          <p className="text-xs text-zinc-400">📍 {listing.location}</p>
          <p className="text-xs text-zinc-400">🎓 {listing.university}</p>
          <p className="text-xs text-zinc-500">
            {listing.available_rooms} room{listing.available_rooms !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-zinc-800 p-3">
          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
            {listing.description}
          </p>
        </div>

        {/* Amenities */}
        {listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.amenities.map((a) => (
              <span
                key={a}
                className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
              >
                {AMENITY_LABELS[a] ?? a}
              </span>
            ))}
          </div>
        )}

        {/* Poster */}
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 p-2">
          {listing.profiles.avatar_url ? (
            <img
              src={listing.profiles.avatar_url}
              alt={listing.profiles.full_name}
              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300 flex-shrink-0">
              {listing.profiles.full_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {listing.profiles.full_name}
            </p>
            <p className="text-xs text-zinc-500">
              Rep score: {listing.profiles.reputation_score} ·{' '}
              {listing.profiles.total_reviews} reviews
            </p>
          </div>
          <p className="ml-auto flex-shrink-0 text-xs text-zinc-600">{postedDate}</p>
        </div>

        {/* WhatsApp */}
        <p className="text-xs text-zinc-500">
          📱 WhatsApp: {listing.whatsapp_number}
        </p>
      </div>

      {/* Action buttons */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        {/* Approve */}
        <form
          action={async () => {
            'use server'
            await approveHousingListing(listing.id)
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            ✓ Approve Listing
          </button>
        </form>

        {/* Verify (approve + verify in one go) */}
        <form
          action={async () => {
            'use server'
            await approveHousingListing(listing.id)
            await verifyHousingListing(listing.id)
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg border border-emerald-500 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10"
          >
            ✓✓ Approve + Mark Verified
          </button>
        </form>

        {/* Reject */}
        <RejectForm listingId={listing.id} />
      </div>
    </div>
  )
}

function RejectForm({ listingId }: { listingId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const reason = formData.get('reason') as string
        if (!reason?.trim()) return
        await rejectHousingListing(listingId, reason.trim())
      }}
      className="space-y-2"
    >
      <input
        name="reason"
        type="text"
        placeholder="Rejection reason (required)"
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
      />
      <button
        type="submit"
        className="w-full rounded-lg border border-red-500/30 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
      >
        ✕ Reject Listing
      </button>
    </form>
  )
}