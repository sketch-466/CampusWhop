import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HousingCard } from '@/components/housing/HousingCard'
import { Button } from '@/components/ui/button'
import { Home, Plus } from 'lucide-react'

// Helper to normalize Supabase joined relation
function normalizeRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

interface PosterProfile {
  full_name: string | null
  avatar_url: string | null
  housing_reputation_score: number | null
  housing_total_reviews: number | null
}

interface HousingListing {
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
  poster: PosterProfile | null
}

export default async function HousingPage() {
  const supabase = await createClient()

  const { data: rawListings, error } = await supabase
    .from('housing_listings')
    .select(`
      id,
      title,
      listing_type,
      location_area,
      distance_to_campus_mins,
      price,
      price_period,
      budget_min,
      budget_max,
      amenities,
      images,
      poster:profiles(id, full_name, avatar_url, housing_reputation_score, housing_total_reviews)
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Housing fetch error:', error)
  }

  const listings: HousingListing[] = (rawListings || []).map((item) => ({
    id: item.id,
    title: item.title,
    listing_type: item.listing_type,
    location_area: item.location_area,
    distance_to_campus_mins: item.distance_to_campus_mins,
    price: item.price,
    price_period: item.price_period,
    budget_min: item.budget_min,
    budget_max: item.budget_max,
    amenities: item.amenities || [],
    images: item.images || [],
    poster: normalizeRelation<PosterProfile>(
      item.poster as PosterProfile | PosterProfile[] | null
    ),
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Home className="h-6 w-6 text-emerald-500" />
            Housing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Find hostels, apartments, and roommates near campus
          </p>
        </div>
        <Link href="/housing/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 gap-1">
            <Plus className="h-4 w-4" />
            Post Listing
          </Button>
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <Home className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No housing listings yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Be the first to post a hostel or apartment!
          </p>
          <Link href="/housing/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Post a Listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <HousingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
