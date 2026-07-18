import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyOpportunities, deleteOpportunity } from '@/lib/actions/opportunities'
import type { Opportunity } from '@/types/database'

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: '🎓 Scholarship',
  internship: '💼 Internship',
  grant: '💰 Grant',
  competition: '🏆 Competition',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

type PageProps = {
  searchParams: Promise<{ success?: string }>
}

export default async function MyOpportunitiesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const opportunities = await getMyOpportunities()

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">My Submissions</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Opportunities you've submitted
            </p>
          </div>
          <Link
            href="/opportunities/new"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            + Submit
          </Link>
        </div>
      </div>

      {/* Success banner */}
      {params.success && (
        <div className="mx-4 mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-400">
            ✓ Opportunity submitted! It will go live after review within 24 hours.
          </p>
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">📋</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">
              No submissions yet
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Know of a scholarship or opportunity? Share it with the community.
            </p>
            <Link
              href="/opportunities/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Submit Opportunity
            </Link>
          </div>
        ) : (
          opportunities.map((opportunity) => (
            <OpportunityRow key={opportunity.id} opportunity={opportunity} />
          ))
        )}
      </div>
    </div>
  )
}

function OpportunityRow({ opportunity }: { opportunity: Opportunity }) {
  const deadlineLabel = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No deadline'

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">
            {opportunity.title}
          </p>
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
              STATUS_STYLES[opportunity.status]
            }`}
          >
            {opportunity.status}
          </span>
        </div>

        <p className="text-xs text-zinc-500">{opportunity.organization}</p>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {CATEGORY_LABELS[opportunity.category]}
          </span>
          {opportunity.amount && (
            <span className="text-xs font-semibold text-emerald-400">
              {opportunity.amount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            🗓️ {deadlineLabel}
          </span>
          <span className="text-xs text-zinc-600">
            👁 {opportunity.views_count} views
          </span>
        </div>
      </div>

      {/* Rejection reason */}
      {opportunity.status === 'rejected' && opportunity.rejection_reason && (
        <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-2">
          <p className="text-xs text-red-400">
            <span className="font-semibold">Rejected: </span>
            {opportunity.rejection_reason}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 border-t border-zinc-800 px-4 py-2">
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          View
        </Link>
        <form
          action={async () => {
            'use server'
            await deleteOpportunity(opportunity.id)
          }}
        >
          <button
            type="submit"
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  )
}