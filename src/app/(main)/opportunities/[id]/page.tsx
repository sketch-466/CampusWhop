import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getOpportunityById,
  incrementOpportunityViews,
  saveOpportunity,
  unsaveOpportunity,
  checkIfSaved,
} from '@/lib/actions/opportunities'

const CATEGORY_STYLES: Record<string, string> = {
  scholarship: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  grant: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  competition: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: '🎓 Scholarship',
  internship: '💼 Internship',
  grant: '💰 Grant',
  competition: '🏆 Competition',
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params

  const [opportunity, supabase] = await Promise.all([
    getOpportunityById(id),
    createClient(),
  ])

  if (!opportunity) notFound()

  await incrementOpportunityViews(id)

  const { data: { user } } = await supabase.auth.getUser()
  const isSaved = user ? await checkIfSaved(id) : false
  const isOwner = user?.id === opportunity.poster_id

  const deadlineDate = opportunity.deadline ? new Date(opportunity.deadline) : null
  const today = new Date()
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const deadlineLabel = !deadlineDate
    ? null
    : daysLeft !== null && daysLeft < 0
    ? 'Expired'
    : daysLeft === 0
    ? 'Closes today'
    : daysLeft !== null && daysLeft <= 7
    ? `⚡ ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
    : deadlineDate.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

  const isUrgent = daysLeft !== null && daysLeft <= 7

  const postedDate = new Date(opportunity.created_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

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
        <div className="flex items-start gap-2">
          <span
            className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
              CATEGORY_STYLES[opportunity.category]
            }`}
          >
            {CATEGORY_LABELS[opportunity.category]}
          </span>
        </div>
        <h1 className="mt-3 text-lg font-bold text-zinc-100 leading-tight">
          {opportunity.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{opportunity.organization}</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Key info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {opportunity.amount && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-zinc-500">Award / Value</span>
              <span className="text-sm font-bold text-emerald-400">
                {opportunity.amount}
              </span>
            </div>
          )}

          {deadlineLabel && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-zinc-500">Deadline</span>
              <span
                className={`text-sm font-semibold ${
                  isUrgent ? 'text-red-400' : 'text-zinc-200'
                }`}
              >
                {deadlineLabel}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-zinc-500">Location</span>
            <span className="text-sm text-zinc-200">
              {opportunity.is_remote
                ? '🌍 Remote / Worldwide'
                : opportunity.location ?? 'Not specified'}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-zinc-500">Views</span>
            <span className="text-xs text-zinc-500">
              👁 {opportunity.views_count}
            </span>
          </div>
        </div>

        {/* Apply CTA */}
        <a
          href={opportunity.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <span>🚀</span>
          <span>Apply Now</span>
        </a>

        {/* Save button */}
        {user && !isOwner && (
          <form
            action={async () => {
              'use server'
              if (isSaved) {
                await unsaveOpportunity(id)
              } else {
                await saveOpportunity(id)
              }
            }}
          >
            <button
              type="submit"
              className={`w-full rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                isSaved
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {isSaved ? '🔖 Saved' : '🔖 Save for Later'}
            </button>
          </form>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-200">About this Opportunity</h2>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
            {opportunity.description}
          </p>
        </div>

        {/* Eligibility */}
        {opportunity.eligibility && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-200">Eligibility</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {opportunity.eligibility}
              </p>
            </div>
          </div>
        )}

        {/* Posted by */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Submitted by
          </h2>
          <div className="flex items-center gap-3">
            {opportunity.profiles.avatar_url ? (
              <img
                src={opportunity.profiles.avatar_url}
                alt={opportunity.profiles.full_name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-300">
                {opportunity.profiles.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {opportunity.profiles.full_name}
              </p>
              <p className="text-xs text-zinc-500">Posted {postedDate}</p>
            </div>
          </div>
        </div>

        {!user && (
          <p className="text-center text-xs text-zinc-500">
            <a href="/login" className="text-emerald-400 hover:underline">
              Sign in
            </a>{' '}
            to save this opportunity
          </p>
        )}
      </div>
    </div>
  )
}