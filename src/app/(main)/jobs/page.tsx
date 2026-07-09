import Link from 'next/link'
import { getActiveJobs } from '@/lib/actions/jobs'
import { JobCard } from '@/components/shared/job-card'
import { Button } from '@/components/ui/button'
import { Briefcase, Plus } from 'lucide-react'

interface JobsPageProps {
  searchParams: Promise<{
    type?: string
    search?: string
    paid?: string
  }>
}

const jobTypes = [
  { value: '', label: 'All' },
  { value: 'job', label: 'Jobs' },
  { value: 'internship', label: 'Internships' },
  { value: 'gig', label: 'Gigs' },
  { value: 'ambassador', label: 'Ambassadors' },
  { value: 'remote', label: 'Remote' },
  { value: 'freelance', label: 'Freelance' },
]

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams
  const filters = {
    job_type: params.type || undefined,
    search: params.search || undefined,
    is_paid: params.paid === 'true' ? true : undefined,
  }

  const { jobs, error } = await getActiveJobs(filters)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-500" />
            Jobs Board
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Find jobs, internships, gigs, and more on campus
          </p>
        </div>
        <Link href="/jobs/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 gap-1">
            <Plus className="h-4 w-4" />
            Post a Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {jobTypes.map((type) => (
          <Link
            key={type.value || 'all'}
            href={`/jobs${type.value ? `?type=${type.value}` : ''}`}
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
          href={`/jobs${params.type ? `?type=${params.type}&paid=true` : '?paid=true'}`}
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
      ) : !jobs || jobs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <Briefcase className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No jobs posted yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Be the first to post a job opportunity!
          </p>
          <Link href="/jobs/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Post a Job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job as any} />
          ))}
        </div>
      )}
    </div>
  )
}
