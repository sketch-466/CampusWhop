import { redirect } from 'next/navigation'
import { getPendingJobs, approveJob, rejectJob } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function AdminJobsPage() {
  const { jobs, error } = await getPendingJobs()
  if (error === 'Unauthorized') redirect('/dashboard')

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Pending Gigs</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {jobs?.length ?? 0} gig post{jobs?.length !== 1 ? 's' : ''} awaiting review.
        </p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No pending gig posts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <div key={job.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{job.title}</h3>
                  <p className="text-sm text-zinc-400">{job.company}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    by {job.poster?.full_name || 'Unknown'} · {job.poster?.email || ''}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {job.job_type} · {job.location}
                    {job.is_remote && ' · Remote'}
                    {job.is_paid && ` · ${job.pay_range || 'Paid'}`}
                  </p>
                  <div className="mt-2 rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                    <p className="text-xs text-zinc-400 line-clamp-3">{job.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <form action={async () => {
                    'use server'
                    await approveJob(job.id)
                  }}>
                    <Button type="submit" size="sm" className="gap-1 bg-emerald-500 hover:bg-emerald-600 w-full">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await rejectJob(job.id, 'Does not meet posting guidelines')
                  }}>
                    <Button type="submit" size="sm" variant="outline" className="gap-1 text-red-400 w-full">
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
  )
}