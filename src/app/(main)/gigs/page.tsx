import Link from 'next/link'
import { getActiveJobs } from '@/lib/actions/jobs'
import { GigCard } from '@/components/shared/gig-card'
import { Button } from '@/components/ui/button'
import { Zap, Plus } from 'lucide-react'

interface GigsPageProps {
  searchParams: Promise<{
    type?: string
    search?: string
    paid?: string
  }>
}

const gigTypes = [
  { value: '', label: 'All' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'gig', label: 'One-time Gig' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
  { value: 'ambassador', label: 'Ambassador' },
  { value: 'job', label: 'Part-time Job' },
]

export default async function GigsPage({ searchParams }: GigsPageProps) {
  const params = await searchParams
  const filters = {
    job_type: params.type || undefined,
    search: params.search || undefined,
    is_paid: params.paid === 'true' ? true : undefined,
  }

  const { jobs: gigs, error } = await getActiveJobs(filters)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-500" />
            Gigs Board
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Find freelance work, remote gigs, and paid opportunities
          </p>
        </div>
        <Link href="/gigs/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 gap-1">
            <Plus className="h-4 w-4" />
            Post a Gig
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {gigTypes.map((type) => (
          <Link
            key={type.value || 'all'}
            href={`/gigs${type.value ? `?type=${type.value}` : ''}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              params.type === type.value || (!params.type && !type.value)
                ? 'bg-emerald-500 text-white'
                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            {type.label}
          </Link>
        ))}
        <Link
          href={`/gigs${params.type ? `?type=${params.type}&paid=true` : '?paid=true'}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            params.paid === 'true'
              ? 'bg-emerald-500 text-white'
              : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
          }`}
        >
          Paid Only
        </Link>
      </div>

      {error ? (
        <p className="text-red-400">{error}</p>
      ) : !gigs || gigs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <Zap className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No gigs posted yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Be the first to post a gig opportunity!
          </p>
          <Link href="/gigs/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Post a Gig
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig as any} />
          ))}
        </div>
      )}
    </div>
  )
}