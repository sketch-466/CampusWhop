import Link from 'next/link'
import type { RoommateListingWithPoster } from '@/types/database'

const GENDER_LABELS: Record<string, string> = {
  male: 'Males Only',
  female: 'Females Only',
  any: 'Any Gender',
}

const GENDER_STYLES: Record<string, string> = {
  male: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  female: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  any: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

type RoommateCardProps = {
  listing: RoommateListingWithPoster
}

export function RoommateCard({ listing }: RoommateCardProps) {
  const moveInDate = new Date(listing.move_in_date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link href={`/housing/roommates/${listing.id}`} className="block">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 transition-colors hover:border-zinc-700">
        {/* Header */}
        <div className="flex items-start gap-3">
          {listing.profiles.avatar_url ? (
            <img
              src={listing.profiles.avatar_url}
              alt={listing.profiles.full_name}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-300 flex-shrink-0">
              {listing.profiles.full_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">{listing.profiles.full_name}</p>
            <h3 className="text-sm font-semibold text-zinc-100 leading-tight truncate">
              {listing.title}
            </h3>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-400">
              ₦{listing.budget_per_year.toLocaleString()}/yr
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${GENDER_STYLES[listing.preferred_gender]}`}
            >
              {GENDER_LABELS[listing.preferred_gender]}
            </span>
          </div>

          <p className="text-xs text-zinc-500 truncate">📍 {listing.location}</p>
          <p className="text-xs text-zinc-500">🗓️ Available from {moveInDate}</p>
        </div>

        {/* Description preview */}
        <p className="text-xs text-zinc-400 line-clamp-2 border-t border-zinc-800 pt-2">
          {listing.description}
        </p>
      </div>
    </Link>
  )
}