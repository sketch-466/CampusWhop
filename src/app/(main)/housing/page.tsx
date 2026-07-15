import Link from 'next/link'
import { Suspense } from 'react'
import { getHousingListings, getRoommateListings } from '@/lib/actions/housing'
import { HousingCard } from '@/components/shared/housing-card'
import { RoommateCard } from '@/components/shared/roommate-card'

const ROOM_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'self_con', label: 'Self-Contained' },
  { value: 'shared_room', label: 'Shared Room' },
  { value: 'mini_flat', label: 'Mini Flat' },
  { value: 'flat', label: 'Flat' },
  { value: 'duplex', label: 'Duplex' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Any Gender' },
  { value: 'male', label: 'Males Only' },
  { value: 'female', label: 'Females Only' },
]

type SearchParams = {
  tab?: string
  room_type?: string
  gender?: string
  max_price?: string
  max_budget?: string
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function HousingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = params.tab === 'roommates' ? 'roommates' : 'hostels'

  const [hostels, roommates] = await Promise.all([
    getHousingListings({
      room_type: params.room_type || undefined,
      max_price: params.max_price ? parseInt(params.max_price) : undefined,
    }),
    getRoommateListings({
      preferred_gender: params.gender || undefined,
      max_budget: params.max_budget ? parseInt(params.max_budget) : undefined,
    }),
  ])

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Housing</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Find verified hostels and roommates near campus
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/housing/new"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              + Post Hostel
            </Link>
            <Link
              href="/housing/roommates/new"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500"
            >
              + Seek Roommate
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-lg bg-zinc-800 p-1">
          <Link
            href="/housing?tab=hostels"
            className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
              tab === 'hostels'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            🏠 Hostels ({hostels.length})
          </Link>
          <Link
            href="/housing?tab=roommates"
            className={`flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors ${
              tab === 'roommates'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            🤝 Roommates ({roommates.length})
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        {tab === 'hostels' ? (
          <form className="flex gap-2 overflow-x-auto pb-1">
            <input type="hidden" name="tab" value="hostels" />
            <select
              name="room_type"
              defaultValue={params.room_type ?? ''}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none flex-shrink-0"
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="max_price"
              defaultValue={params.max_price ?? ''}
              placeholder="Max price/yr"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none w-32 flex-shrink-0"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 flex-shrink-0"
            >
              Filter
            </button>
            <Link
              href="/housing?tab=hostels"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300 flex-shrink-0"
            >
              Clear
            </Link>
          </form>
        ) : (
          <form className="flex gap-2 overflow-x-auto pb-1">
            <input type="hidden" name="tab" value="roommates" />
            <select
              name="gender"
              defaultValue={params.gender ?? ''}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none flex-shrink-0"
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="max_budget"
              defaultValue={params.max_budget ?? ''}
              placeholder="Max budget/yr"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none w-32 flex-shrink-0"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 flex-shrink-0"
            >
              Filter
            </button>
            <Link
              href="/housing?tab=roommates"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300 flex-shrink-0"
            >
              Clear
            </Link>
          </form>
        )}
      </div>

      {/* Listings */}
      <div className="px-4 py-4">
        {tab === 'hostels' ? (
          hostels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-3">🏠</span>
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">
                No hostels listed yet
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Be the first to post a hostel near campus
              </p>
              <Link
                href="/housing/new"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Post a Hostel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {hostels.map((listing) => (
                <HousingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )
        ) : roommates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">🤝</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">
              No roommate posts yet
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Looking for someone to share rent with?
            </p>
            <Link
              href="/housing/roommates/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Post Roommate Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roommates.map((listing) => (
              <RoommateCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}