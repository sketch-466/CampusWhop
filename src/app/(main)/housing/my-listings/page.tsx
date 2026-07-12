import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Trash2, XCircle } from 'lucide-react'

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  active: 'success',
  rejected: 'destructive',
  closed: 'default',
}

export default async function MyHousingListingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: listings, error } = await supabase
    .from('housing_listings')
    .select('*')
    .eq('poster_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('My housing listings error:', error)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/housing"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Housing
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Housing Listings</h1>
        <Link href="/housing/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Post New
          </Button>
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-zinc-400">You have not posted any housing listings yet.</p>
          <Link href="/housing/new">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
              Post a Listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">
                      {listing.title}
                    </h3>
                    <Badge variant={statusColors[listing.status] || 'default'}>
                      {listing.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{listing.location_area}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {listing.views_count || 0} views · Posted{' '}
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                  {listing.rejection_reason && (
                    <p className="mt-1 text-xs text-red-400">
                      Reason: {listing.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link href={`/housing/${listing.id}`}>
                    <Button size="sm" variant="outline" className="h-8 px-2">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {listing.status === 'active' && (
                    <form
                      action={async () => {
                        'use server'
                        const { createClient } = await import('@/lib/supabase/server')
                        const supabase = await createClient()
                        await supabase
                          .from('housing_listings')
                          .update({ status: 'closed' })
                          .eq('id', listing.id)
                          .eq('poster_id', user.id)
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
                      const { createClient } = await import('@/lib/supabase/server')
                      const supabase = await createClient()
                      await supabase
                        .from('housing_listings')
                        .update({
                          deleted_at: new Date().toISOString(),
                          status: 'deleted',
                        })
                        .eq('id', listing.id)
                        .eq('poster_id', user.id)
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
