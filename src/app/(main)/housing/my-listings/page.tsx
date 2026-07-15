import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyHousingListings, deleteHousingListing, deleteRoommateListing, markRoommateListingFilled } from '@/lib/actions/housing'
import type { HousingListing, RoommateListing } from '@/types/database'

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
  filled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  expired: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Males Only',
  female: 'Females Only',
  any: 'Any Gender',
}

type PageProps = {
  searchParams: Promise<{ success?: string }>
}

export default async function MyHousingListingsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const { hostels, roommates } = await getMyHousingListings()

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">My Housing Posts</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage your hostel and roommate listings
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/housing/new"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              + Hostel
            </Link>
            <Link
              href="/housing/roommates/new"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500"
            >
              + Roommate
            </Link>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {params.success && (
        <div className="mx-4 mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400">
            {params.success === 'hostel'
              ? '✓ Hostel listing submitted! It will go live after review within 24 hours.'
              : '✓ Roommate post is now live!'}
          </p>
        </div>
      )}

      <div className="px-4 py-5 space-y-8">
        {/* My Hostels */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            My Hostels ({hostels.length})
          </h2>

          {hostels.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-500 mb-3">No hostel listings yet</p>
              <Link
                href="/housing/new"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Post a Hostel
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {hostels.map((hostel) => (
                <HostelListingRow key={hostel.id} hostel={hostel} />
              ))}
            </div>
          )}
        </section>

        {/* My Roommate Posts */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            My Roommate Posts ({roommates.length})
          </h2>

          {roommates.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-sm text-zinc-500 mb-3">No roommate posts yet</p>
              <Link
                href="/housing/roommates/new"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Post Roommate Request
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {roommates.map((roommate) => (
                <RoommateListingRow key={roommate.id} roommate={roommate} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function HostelListingRow({ hostel }: { hostel: HousingListing }) {
  const firstImage = hostel.images?.[0]

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          {firstImage ? (
            <img
              src={firstImage}
              alt={hostel.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              🏠
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-100 truncate">
              {hostel.title}
            </p>
            <span
              className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[hostel.status]}`}
            >
              {hostel.status}
            </span>
          </div>

          <p className="text-xs text-emerald-400 font-semibold">
            ₦{hostel.price_per_year.toLocaleString()}/yr
          </p>

          <p className="text-xs text-zinc-500">
            {ROOM_TYPE_LABELS[hostel.room_type]} · {hostel.location}
          </p>

          <p className="text-xs text-zinc-600">
            👁 {hostel.views_count} views
            {hostel.is_verified && (
              <span className="ml-2 text-emerald-400">✓ Verified</span>
            )}
          </p>
        </div>
      </div>

      {/* Rejection reason */}
      {hostel.status === 'rejected' && hostel.rejection_reason && (
        <div className="border-t border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-xs text-red-400">
            <span className="font-semibold">Rejected: </span>
            {hostel.rejection_reason}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-zinc-800 px-3 py-2">
        <Link
          href={`/housing/${hostel.id}`}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          View
        </Link>
        <form
          action={async () => {
            'use server'
            await deleteHousingListing(hostel.id)
          }}
        >
          <button
            type="submit"
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  )
}

function RoommateListingRow({ roommate }: { roommate: RoommateListing }) {
  const moveInDate = new Date(roommate.move_in_date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-100 truncate">
            {roommate.title}
          </p>
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[roommate.status]}`}
          >
            {roommate.status}
          </span>
        </div>

        <p className="text-xs text-emerald-400 font-semibold">
          ₦{roommate.budget_per_year.toLocaleString()}/yr budget
        </p>

        <p className="text-xs text-zinc-500">
          {GENDER_LABELS[roommate.preferred_gender]} · {roommate.location}
        </p>

        <p className="text-xs text-zinc-500">
          🗓️ Available from {moveInDate}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-zinc-800 px-3 py-2">
        <Link
          href={`/housing/roommates/${roommate.id}`}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          View
        </Link>
        {roommate.status === 'active' && (
          <form
            action={async () => {
              'use server'
              await markRoommateListingFilled(roommate.id)
            }}
          >
            <button
              type="submit"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Mark as Filled
            </button>
          </form>
        )}
        <form
          action={async () => {
            'use server'
            await deleteRoommateListing(roommate.id)
          }}
        >
          <button
            type="submit"
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  )
}