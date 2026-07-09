import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPendingJobs, approveJob, rejectJob } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

export default async function AdminJobsPage() {
  const { jobs, error } = await getPendingJobs()

  if (error === 'Unauthorized') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/admin/listings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Job Approvals</h1>

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
              <div className="flex items-start justify-between">
                <div>
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
                <div className="flex items-center gap-1">
                  <form
                    action={async () => {
                      'use server'
                      await approveJob(job.id)
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="gap-1 bg-emerald-500 hover:bg-emerald-600"
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
                      className="gap-1 text-red-400"
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
  )
}
