import Link from 'next/link'
import { MapPin, Home, Users, Droplets, Zap, Shield, Wifi, ChefHat, Fuel, Car, Sofa } from 'lucide-react'

interface HousingCardProps {
  listing: {
    id: string
    title: string
    listing_type: string
    location_area: string
    distance_to_campus_mins: number | null
    price: number | null
    price_period: string | null
    budget_min: number | null
    budget_max: number | null
    amenities: string[]
    images: string[]
    poster: {
      full_name: string | null
      avatar_url: string | null
      housing_reputation_score: number | null
      housing_total_reviews: number | null
    } | null
  }
}

const amenityIcons: Record<string, React.ReactNode> = {
  water: <Droplets className="h-3.5 w-3.5" />,
  electricity: <Zap className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
  wifi: <Wifi className="h-3.5 w-3.5" />,
  kitchen: <ChefHat className="h-3.5 w-3.5" />,
  generator: <Fuel className="h-3.5 w-3.5" />,
  parking: <Car className="h-3.5 w-3.5" />,
  furnished: <Sofa className="h-3.5 w-3.5" />,
}

const listingTypeLabels: Record<string, string> = {
  hostel: 'Hostel',
  self_contain: 'Self Contain',
  shared_apartment: 'Shared Apartment',
  roommate_wanted: 'Roommate Wanted',
}

const listingTypeIcons: Record<string, React.ReactNode> = {
  hostel: <Home className="h-3.5 w-3.5" />,
  self_contain: <Home className="h-3.5 w-3.5" />,
  shared_apartment: <Users className="h-3.5 w-3.5" />,
  roommate_wanted: <Users className="h-3.5 w-3.5" />,
}

const pricePeriodLabels: Record<string, string> = {
  per_session: 'session',
  per_month: 'month',
  per_year: 'year',
}

function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`
}

export function HousingCard({ listing }: HousingCardProps) {
  const isRoommateWanted = listing.listing_type === 'roommate_wanted'
  const firstImage = listing.images?.[0]
  const visibleAmenities = listing.amenities?.slice(0, 4) || []
  const hiddenAmenityCount = (listing.amenities?.length || 0) - 4

  const posterInitials = listing.poster?.full_name
    ? listing.poster.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const reputationScore = listing.poster?.housing_reputation_score ?? 0
  const totalReviews = listing.poster?.housing_total_reviews ?? 0

  return (
    <Link
      href={`/housing/${listing.id}`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
    >
      {/* Cover Image */}
      <div className="aspect-[16/10] bg-zinc-800 relative overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <Home className="h-10 w-10" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
            {listingTypeIcons[listing.listing_type]}
            {listingTypeLabels[listing.listing_type] || listing.listing_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {listing.title}
        </h3>

        {/* Price - conditional */}
        <p className="mt-1 text-lg font-bold text-emerald-500">
          {isRoommateWanted ? (
            <>
              {listing.budget_min !== null && listing.budget_max !== null
                ? `${formatPrice(listing.budget_min)} - ${formatPrice(listing.budget_max)}`
                : 'Budget TBD'}
            </>
          ) : (
            <>
              {listing.price !== null
                ? `${formatPrice(listing.price)}/${pricePeriodLabels[listing.price_period || ''] || listing.price_period || ''}`
                : 'Price TBD'}
            </>
          )}
        </p>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
          <MapPin className="h-3 w-3" />
          {listing.location_area}
          {listing.distance_to_campus_mins !== null && (
            <span className="text-zinc-500">
              · {listing.distance_to_campus_mins} min from campus
            </span>
          )}
        </p>

        {/* Amenities */}
        {visibleAmenities.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {visibleAmenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {amenityIcons[amenity] || null}
                {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
              </span>
            ))}
            {hiddenAmenityCount > 0 && (
              <span className="text-[10px] text-zinc-600">
                +{hiddenAmenityCount} more
              </span>
            )}
          </div>
        )}

        {/* Poster */}
        <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-white">
            {posterInitials}
          </div>
          <span className="text-xs text-zinc-400">
            {listing.poster?.full_name || 'Unknown'}
          </span>
          {totalReviews > 0 && (
            <span className="ml-auto text-xs text-yellow-400">
              ★ {reputationScore.toFixed(1)} ({totalReviews})
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
