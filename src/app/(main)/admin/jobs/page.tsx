import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPendingJobs, approveJob, rejectJob } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function AdminJobsPage() {
  const { jobs, error } = await getPendingJobs()

  if (error === 'Unauthorized') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      <p className="text-zinc-400 mt-1">Manage listings, jobs, and disputes</p>

      {/* Admin Navigation */}
      <div className="flex gap-3 mt-6 border-b border-zinc-800 pb-4">
        <Link
          href="/admin/listings"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Listings
        </Link>
        <Link
          href="/admin/jobs"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          Jobs
        </Link>
        <Link
          href="/admin/disputes"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Disputes
        </Link>
      </div>

      <div className="mt-6">
        {!jobs || jobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-zinc-400">No pending job posts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div
                key={job.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-zinc-400">{job.company}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      by {job.poster?.full_name || 'Unknown'} · {job.poster?.email || ''}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Type: {job.job_type} · Location: {job.location}
                      {job.is_remote && ' · Remote'}
                      {job.is_paid && ` · Pay: ${job.pay_range || 'Paid'}`}
                    </p>
                    <div className="mt-2 rounded-lg bg-zinc-900/50 p-2">
                      <p className="text-xs text-zinc-400 line-clamp-2">{job.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <form
                      action={async () => {
                        'use server'
                        await approveJob(job.id)
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1 bg-emerald-500 hover:bg-emerald-600 w-full"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        'use server'
                        await rejectJob(job.id, 'Does not meet posting guidelines')
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-400 w-full"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}