import Link from 'next/link'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import type { HousingListingWithPoster } from '@/types/database'

const ROOM_TYPE_LABELS: Record<string, string> = {
  self_con: 'Self-Contained',
  shared_room: 'Shared Room',
  mini_flat: 'Mini Flat',
  flat: 'Flat',
  duplex: 'Duplex',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

type HousingCardProps = {
  listing: HousingListingWithPoster
  showStatus?: boolean
}

export function HousingCard({ listing, showStatus = false }: HousingCardProps) {
  const firstImage = listing.images?.[0]

  return (
    <Link href={`/housing/${listing.id}`} className="block">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
        {/* Image */}
        <div className="relative aspect-video w-full bg-zinc-800">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              <span className="text-4xl">🏠</span>
            </div>
          )}

          {/* Verified badge */}
          {listing.is_verified && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-medium text-white">
              <span>✓</span>
              <span>Verified</span>
            </div>
          )}

          {/* Status badge — owner only */}
          {showStatus && (
            <div
              className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[listing.status]}`}
            >
              {listing.status}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className="truncate text-sm font-semibold text-zinc-100">
            {listing.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-400">
              ₦{listing.price_per_year.toLocaleString()}/yr
            </span>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
            </span>
          </div>

          <p className="text-xs text-zinc-500 truncate">📍 {listing.location}</p>

          {/* Poster */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
            {listing.profiles.avatar_url ? (
              <img
                src={listing.profiles.avatar_url}
                alt={listing.profiles.full_name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-400">
                {listing.profiles.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs text-zinc-400 truncate">
              {listing.profiles.full_name}
            </span>
            <div className="ml-auto">
              <ReputationBadge score={listing.profiles.reputation_score} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}