import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getJobById, getJobApplications, updateApplicationStatus } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

interface ApplicantsPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  reviewing: 'default',
  accepted: 'success',
  rejected: 'destructive',
}

export default async function GigApplicantsPage({ params }: ApplicantsPageProps) {
  const { id } = await params
  const { job: gig } = await getJobById(id)

  if (!gig) notFound()

  const { applications, error } = await getJobApplications(id)

  if (error) redirect('/gigs/my-posts')

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href={`/gigs/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Gig
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">Applicants</h1>
      <p className="text-sm text-zinc-400 mb-6">
        {gig.title} · {gig.company}
      </p>

      {!applications || applications.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-zinc-400">No applications yet.</p>
          <p className="text-xs text-zinc-500 mt-1">
            Share your gig link to get more applicants.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-white shrink-0">
                    {app.applicant?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {app.applicant?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {app.applicant?.university || 'No university'} ·{' '}
                      Rep: {(app.applicant?.reputation_score || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={statusColors[app.status] || 'default'}>
                  {app.status}
                </Badge>
              </div>

              <div className="mt-3 rounded-lg bg-zinc-900/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">Cover letter:</p>
                <p className="text-sm text-zinc-300">{app.cover_letter}</p>
              </div>

              <div className="mt-3 flex gap-2">
                {app.status !== 'accepted' && (
                  <form
                    action={async () => {
                      'use server'
                      await updateApplicationStatus(app.id, 'accepted')
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Accept
                    </Button>
                  </form>
                )}
                {app.status !== 'rejected' && (
                  <form
                    action={async () => {
                      'use server'
                      await updateApplicationStatus(app.id, 'rejected')
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}