import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserJobPosts } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, Users, XCircle, Trash2 } from 'lucide-react'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  active: 'success',
  rejected: 'destructive',
  closed: 'default',
}

export default async function MyJobPostsPage() {
  const { jobs, error } = await getUserJobPosts()

  if (error) {
    redirect('/jobs')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">My Job Posts</h1>

      {!jobs || jobs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-zinc-400">You haven't posted any jobs yet.</p>
          <Link href="/jobs/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Post a Job
            </Button>
          </Link>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{job.title}</h3>
                    <Badge variant={statusColors[job.status] || 'default'}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{job.company}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {job.views_count || 0} views
                    </span>
                    {job.apply_method === 'internal' && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {job.applications_count?.[0]?.count || 0} applications
                      </span>
                    )}
                  </div>
                  {job.rejection_reason && (
                    <p className="mt-1 text-xs text-red-400">
                      Reason: {job.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/jobs/${job.id}`}>
                    <Button size="sm" variant="outline" className="h-8 px-2">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {job.apply_method === 'internal' && job.status === 'active' && (
                    <Link href={`/jobs/${job.id}/applicants`}>
                      <Button size="sm" variant="outline" className="h-8 px-2">
                        <Users className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                  {job.status === 'active' && (
                    <form
                      action={async () => {
                        'use server'
                        const { closeJobPost } = await import('@/lib/actions/jobs')
                        await closeJobPost(job.id)
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-yellow-400"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      'use server'
                      const { deleteJobPost } = await import('@/lib/actions/jobs')
                      await deleteJobPost(job.id)
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
