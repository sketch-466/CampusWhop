import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHousingListingById, getHousingReviews, incrementHousingViews } from '@/lib/actions/housing'
import { HousingReviewFormWrapper } from '@/components/shared/housing-review-form-wrapper'
import { ReputationBadge } from '@/components/shared/reputation-badge'
import { StarRating } from '@/components/shared/star-rating'
import ViewTracker from '@/components/shared/view-tracker'

const ROOM_TYPE_LABELS: Record<string, string> = {
  self_con: 'Self-Contained',
  shared_room: 'Shared Room',
  mini_flat: 'Mini Flat',
  flat: 'Flat',
  duplex: 'Duplex',
}

const AMENITY_LABELS: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'WiFi', icon: '📶' },
  water: { label: 'Running Water', icon: '💧' },
  generator: { label: 'Generator', icon: '⚡' },
  security: { label: 'Security', icon: '🔒' },
  parking: { label: 'Parking', icon: '🚗' },
  kitchen: { label: 'Kitchen', icon: '🍳' },
  bathroom_ensuite: { label: 'Ensuite Bathroom', icon: '🚿' },
  fence: { label: 'Fenced Compound', icon: '🏠' },
  borehole: { label: 'Borehole', icon: '🪣' },
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function HousingDetailPage({ params }: PageProps) {
  const { id } = await params

  const [listing, reviews] = await Promise.all([
    getHousingListingById(id),
    getHousingReviews(id),
  ])

  if (!listing) notFound()

  await incrementHousingViews(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const alreadyReviewed = user
    ? reviews.some((r) => r.reviewer_id === user.id)
    : false

  const isOwner = user?.id === listing.poster_id

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  const whatsappUrl = `https://wa.me/234${listing.whatsapp_number.replace(/^0/, '')}?text=${encodeURIComponent(`Hi, I saw your hostel listing "${listing.title}" on CampusWhop and I'm interested.`)}`

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <ViewTracker entityType="housing" entityId={id} userId={user?.id ?? null} />

      {/* Image Gallery */}
      <div className="relative w-full bg-zinc-900">
        {listing.images.length > 0 ? (
          <div className="space-y-1">
            <div className="aspect-video w-full">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto px-1 pb-1">
                {listing.images.slice(1).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${listing.title} photo ${i + 2}`}
                    className="h-16 w-24 flex-shrink-0 rounded object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center text-zinc-600">
            <span className="text-6xl">🏠</span>
          </div>
        )}

        {listing.is_verified && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white">
            <span>✓</span>
            <span>Verified by CampusWhop</span>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-bold text-zinc-100 leading-tight">
              {listing.title}
            </h1>
            <span className="flex-shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              {ROOM_TYPE_LABELS[listing.room_type] ?? listing.room_type}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xl font-bold text-emerald-400">
              ₦{listing.price_per_year.toLocaleString()}/yr
            </span>
            {listing.available_rooms > 1 && (
              <span className="text-xs text-zinc-500">
                {listing.available_rooms} rooms available
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">📍 {listing.location}</p>
          <p className="text-xs text-zinc-500">🎓 {listing.university}</p>
        </div>

        {avgRating !== null && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avgRating)} readonly />
            <span className="text-sm font-semibold text-zinc-200">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-500">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {!isOwner && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <span>💬</span>
            <span>Contact on WhatsApp</span>
          </a>
        )}

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-200">About this place</h2>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>

        {listing.amenities.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-200">Amenities</h2>
            <div className="grid grid-cols-3 gap-2">
              {listing.amenities.map((a) => {
                const info = AMENITY_LABELS[a]
                return (
                  <div
                    key={a}
                    className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-center"
                  >
                    <span className="text-lg">{info?.icon ?? '✓'}</span>
                    <span className="text-xs text-zinc-400">
                      {info?.label ?? a}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Posted by
          </h2>
          <div className="flex items-center gap-3">
            {listing.profiles.avatar_url ? (
              <img
                src={listing.profiles.avatar_url}
                alt={listing.profiles.full_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-lg font-semibold text-zinc-300">
                {listing.profiles.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {listing.profiles.full_name}
              </p>
              <div className="mt-0.5">
                <ReputationBadge score={listing.profiles.reputation_score} totalReviews={listing.profiles.total_reviews} size="sm" />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-zinc-500">
                {listing.profiles.total_reviews}{' '}
                {listing.profiles.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-600 text-center">
          👁 {listing.views_count} views ·{' '}
          Listed {new Date(listing.created_at).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200">
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 && (
            <p className="text-xs text-zinc-500">
              No reviews yet. Be the first to review this hostel.
            </p>
          )}

          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                {review.profiles.avatar_url ? (
                  <img
                    src={review.profiles.avatar_url}
                    alt={review.profiles.full_name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
                    {review.profiles.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    {review.profiles.full_name}
                  </p>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{review.comment}</p>
              <p className="text-xs text-zinc-600">
                {new Date(review.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}

          {user && !isOwner && !alreadyReviewed && (
            <HousingReviewFormWrapper listingId={listing.id} />
          )}

          {!user && (
            <p className="text-xs text-zinc-500 text-center">
              <a href="/login" className="text-emerald-400 hover:underline">
                Sign in
              </a>{' '}
              to leave a review
            </p>
          )}

          {user && alreadyReviewed && (
            <p className="text-xs text-zinc-500 text-center">
              ✓ You have already reviewed this listing
            </p>
          )}
        </div>
      </div>
    </div>
  )
}