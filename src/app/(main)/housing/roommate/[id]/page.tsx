import { notFound } from 'next/navigation'
import { getRoommateListingById } from '@/lib/actions/housing'

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

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RoommateDetailPage({ params }: PageProps) {
  const { id } = await params
  const listing = await getRoommateListingById(id)

  if (!listing) notFound()

  const moveInDate = new Date(listing.move_in_date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const postedDate = new Date(listing.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const whatsappUrl = `https://wa.me/234${listing.whatsapp_number.replace(/^0/, '')}?text=${encodeURIComponent(`Hi ${listing.profiles.full_name}, I saw your roommate listing "${listing.title}" on CampusWhop and I'm interested.`)}`

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <a
          href="/housing?tab=roommates"
          className="mb-3 block text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← Back to Roommates
        </a>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold text-zinc-100 leading-tight">
            {listing.title}
          </h1>
          <span
            className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${GENDER_STYLES[listing.preferred_gender]}`}
          >
            {GENDER_LABELS[listing.preferred_gender]}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Posted {postedDate}</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Poster Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Looking for a Roommate
          </h2>
          <div className="flex items-center gap-3">
            {listing.profiles.avatar_url ? (
              <img
                src={listing.profiles.avatar_url}
                alt={listing.profiles.full_name}
                className="h-14 w-14 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-xl font-semibold text-zinc-300 flex-shrink-0">
                {listing.profiles.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-semibold text-zinc-100 truncate">
                {listing.profiles.full_name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">🎓 {listing.university}</p>
            </div>
          </div>
        </div>

        {/* Key Details */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-zinc-500">Budget</span>
            <span className="text-sm font-bold text-emerald-400">
              ₦{listing.budget_per_year.toLocaleString()}/yr
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-zinc-500">Preferred Area</span>
            <span className="text-sm text-zinc-200 text-right max-w-[60%]">
              {listing.location}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-zinc-500">Roommate Gender</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${GENDER_STYLES[listing.preferred_gender]}`}
            >
              {GENDER_LABELS[listing.preferred_gender]}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-zinc-500">Available From</span>
            <span className="text-sm text-zinc-200">{moveInDate}</span>
          </div>
        </div>

        {/* About */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-200">About Me</h2>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <span>💬</span>
          <span>Contact on WhatsApp</span>
        </a>

        <p className="text-center text-xs text-zinc-600">
          Always meet in a public place first. Stay safe.
        </p>
      </div>
    </div>
  )
}