import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasReviewedHousingListing } from '@/lib/actions/housing'
import { HousingReviewForm } from '@/components/housing/HousingReviewForm'
import { StarRating } from '@/components/shared/star-rating'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  MapPin,
  Home,
  Droplets,
  Zap,
  Shield,
  Wifi,
  ChefHat,
  Fuel,
  Car,
  Sofa,
  Phone,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface HousingDetailPageProps {
  params: Promise<{ id: string }>
}

const amenityIcons: Record<string, React.ReactNode> = {
  water: <Droplets className="h-4 w-4" />,
  electricity: <Zap className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  wifi: <Wifi className="h-4 w-4" />,
  kitchen: <ChefHat className="h-4 w-4" />,
  generator: <Fuel className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  furnished: <Sofa className="h-4 w-4" />,
}

const listingTypeLabels: Record<string, string> = {
  hostel: 'Hostel',
  self_contain: 'Self Contain',
  shared_apartment: 'Shared Apartment',
  roommate_wanted: 'Roommate Wanted',
}

const pricePeriodLabels: Record<string, string> = {
  per_session: 'session',
  per_month: 'month',
  per_year: 'year',
}

function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`
}

function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

interface PosterProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone_number: string | null
  whatsapp_number: string | null
  housing_reputation_score: number | null
  housing_total_reviews: number | null
}

interface ReviewerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface HousingReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: ReviewerProfile | null
}

export default async function HousingDetailPage({
  params,
}: HousingDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rawListing, error: listingError } = await supabase
    .from('housing_listings')
    .select(
      `
      *,
      poster:profiles!housing_listings_poster_id_fkey (
        id,
        full_name,
        avatar_url,
        phone_number,
        whatsapp_number,
        housing_reputation_score,
        housing_total_reviews
      )
    `
    )
    .eq('id', id)
    .single()

  if (listingError || !rawListing) {
    notFound()
  }

  const poster = normalizeRelation(
    rawListing.poster as unknown as PosterProfile | PosterProfile[] | null
  )

  // Visibility check: non-active listings only visible to owner or admin
  if (rawListing.status !== 'active') {
    const isOwner = user?.id === rawListing.poster_id
    let isAdmin = false
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      isAdmin = !!profile?.is_admin
    }
    if (!isOwner && !isAdmin) {
      notFound()
    }
  }

  // Increment view count (fire-and-forget, only for non-owners)
  if (user?.id !== rawListing.poster_id) {
    await supabase
      .from('housing_listings')
      .update({ views_count: (rawListing.views_count || 0) + 1 })
      .eq('id', id)
  }

  const isOwner = user?.id === rawListing.poster_id
  const canReview =
    !!user && !isOwner && !(await hasReviewedHousingListing(id))

  // Fetch reviews
  const { data: rawReviews } = await supabase
    .from('housing_reviews')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      reviewer:profiles!housing_reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq('reviewee_id', rawListing.poster_id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const reviews: HousingReview[] =
    rawReviews?.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer: normalizeRelation(
        r.reviewer as unknown as ReviewerProfile | ReviewerProfile[] | null
      ),
    })) ?? []

  const images = (rawListing.images as string[]) || []
  const isRoommateWanted = rawListing.listing_type === 'roommate_wanted'
  const posterInitials = poster?.full_name
    ? poster.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/housing"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Housing
      </Link>

      {/* Image Gallery */}
      <div className="space-y-2">
        <div className="aspect-[16/10] rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden relative">
          {images.length > 0 ? (
            <Image
              src={images[0]}
              alt={rawListing.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Home className="h-10 w-10" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.slice(1).map((img: string, i: number) => (
              <div
                key={i}
                className="h-16 w-16 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden relative"
              >
                <Image
                  src={img}
                  alt={`${rawListing.title} ${i + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title & Type */}
      <div className="mt-6">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
          {listingTypeLabels[rawListing.listing_type] || rawListing.listing_type}
        </span>
        <h1 className="mt-2 text-2xl font-bold text-white">
          {rawListing.title}
        </h1>
      </div>

      {/* Price */}
      <p className="mt-2 text-2xl font-bold text-emerald-500">
        {isRoommateWanted ? (
          <>
            {rawListing.budget_min !== null && rawListing.budget_max !== null
              ? `${formatPrice(rawListing.budget_min)} - ${formatPrice(rawListing.budget_max)}`
              : 'Budget TBD'}
          </>
        ) : (
          <>
            {rawListing.price !== null
              ? `${formatPrice(rawListing.price)}/${pricePeriodLabels[rawListing.price_period || ''] || rawListing.price_period || ''}`
              : 'Price TBD'}
          </>
        )}
      </p>

      {/* Location */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {rawListing.location_area}
        </span>
        {rawListing.distance_to_campus_mins !== null && (
          <span className="text-zinc-500">
            · {rawListing.distance_to_campus_mins} min from campus
          </span>
        )}
        {rawListing.room_type && (
          <span className="text-zinc-500">· {rawListing.room_type}</span>
        )}
        <span className="text-zinc-500">
          {rawListing.views_count || 0} views
        </span>
      </div>

      {/* Amenities */}
      {rawListing.amenities && rawListing.amenities.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-white mb-2">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {rawListing.amenities.map((amenity: string) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
              >
                {amenityIcons[amenity] || null}
                {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {rawListing.description}
        </p>
      </div>

      {/* Poster Card */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-white">
            {posterInitials}
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">
              {poster?.full_name || 'Unknown'}
            </p>
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <span>★</span>
              <span>
                {(poster?.housing_reputation_score || 0).toFixed(1)} (
                {poster?.housing_total_reviews || 0})
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="mt-3 rounded-lg border border-yellow-800 bg-yellow-900/20 p-3">
            <p className="text-sm text-yellow-400">This is your listing</p>
          </div>
        )}

        {!isOwner && (
          <div className="mt-3 flex flex-wrap gap-2">
            {poster?.phone_number && (
              <a
                href={`tel:${poster.phone_number}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
            {poster?.whatsapp_number && (
              <a
                href={`https://wa.me/${poster.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm text-white transition-colors hover:bg-emerald-600"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-white">
                      {review.reviewer?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-zinc-300">
                      {review.reviewer?.full_name || 'Unknown'}
                    </span>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-zinc-300">
                    {review.comment}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form */}
      {!user ? (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-center">
          <p className="text-sm text-zinc-400">Sign in to leave a review</p>
          <Link href="/login">
            <Button className="mt-2 bg-emerald-500 hover:bg-emerald-600">
              Sign In
            </Button>
          </Link>
        </div>
      ) : isOwner ? (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-sm text-zinc-500">
            You cannot review your own listing
          </p>
        </div>
      ) : canReview ? (
        <div className="mt-6">
          <HousingReviewForm listingId={id} />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-900/20 p-4">
          <p className="text-sm text-emerald-400">
            ✓ You have reviewed this listing
          </p>
        </div>
      )}
    </div>
  )
}
 
 