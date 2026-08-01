import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserJobPosts } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Eye, Users, XCircle, Trash2, Zap } from 'lucide-react'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  active: 'success',
  rejected: 'destructive',
  closed: 'default',
}

export default async function MyGigPostsPage() {
  const { jobs: gigs, error } = await getUserJobPosts()

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

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Gigs</h1>
        <Link href="/gigs/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600 gap-1">
            <Zap className="h-4 w-4" />
            Post a Gig
          </Button>
        </Link>
      </div>

      {!gigs || gigs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <Zap className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">You haven&apos;t posted any gigs yet.</p>
          <Link href="/gigs/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Post a Gig
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {gigs.map((gig: any) => (
            <div
              key={gig.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{gig.title}</h3>
                    <Badge variant={statusColors[gig.status] || 'default'}>
                      {gig.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{gig.company}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {gig.views_count || 0} views
                    </span>
                    {gig.apply_method === 'internal' && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {gig.applications_count?.[0]?.count || 0} applicants
                      </span>
                    )}
                  </div>
                  {gig.rejection_reason && (
                    <p className="mt-1 text-xs text-red-400">
                      Reason: {gig.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/gigs/${gig.id}`}>
                    <Button size="sm" variant="outline" className="h-8 px-2">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {gig.apply_method === 'internal' && gig.status === 'active' && (
                    <Link href={`/gigs/${gig.id}/applicants`}>
                      <Button size="sm" variant="outline" className="h-8 px-2">
                        <Users className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                  {gig.status === 'active' && (
                    <form
                      action={async () => {
                        'use server'
                        const { closeJobPost } = await import('@/lib/actions/jobs')
                        await closeJobPost(gig.id)
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
                      await deleteJobPost(gig.id)
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