import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserApplications } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Zap } from 'lucide-react'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  reviewing: 'default',
  accepted: 'success',
  rejected: 'destructive',
}

export default async function MyGigApplicationsPage() {
  const { applications, error } = await getUserApplications()

  if (error) redirect('/gigs')

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/gigs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Gigs
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">My Applications</h1>

      {!applications || applications.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <Zap className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">You haven&apos;t applied to any gigs yet.</p>
          <Link href="/gigs">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Browse Gigs
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => (
            <div
              key={app.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link href={`/gigs/${app.job_id}`}>
                    <h3 className="font-semibold text-white hover:text-emerald-400 transition-colors">
                      {app.job?.title || 'Unknown Gig'}
                    </h3>
                  </Link>
                  <p className="text-sm text-zinc-400">{app.job?.company || ''}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={statusColors[app.status] || 'default'}>
                      {app.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-zinc-900/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">Your cover letter:</p>
                <p className="text-sm text-zinc-300 line-clamp-3">{app.cover_letter}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}