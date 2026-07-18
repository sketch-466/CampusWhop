import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSavedOpportunities } from '@/lib/actions/opportunities'
import { OpportunityCard } from '@/components/shared/opportunity-card'

export default async function SavedOpportunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const opportunities = await getSavedOpportunities()

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <a
          href="/opportunities"
          className="mb-3 block text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← Back to Opportunities
        </a>
        <h1 className="text-lg font-bold text-zinc-100">Saved Opportunities</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Opportunities you've bookmarked
        </p>
      </div>

      <div className="px-4 py-4">
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">🔖</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">
              No saved opportunities
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Browse opportunities and save the ones you want to track
            </p>
            <Link
              href="/opportunities"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600">
              {opportunities.length} saved opportunit{opportunities.length === 1 ? 'y' : 'ies'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isSaved
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}