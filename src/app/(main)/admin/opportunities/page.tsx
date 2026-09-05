import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPendingOpportunities, approveOpportunity, rejectOpportunity } from '@/lib/actions/opportunities'
import type { OpportunityWithPoster } from '@/types/database'
import { CheckCircle, XCircle } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: '🎓 Scholarship',
  internship: '💼 Internship',
  grant: '💰 Grant',
  competition: '🏆 Competition',
}

const CATEGORY_STYLES: Record<string, string> = {
  scholarship: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  grant: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  competition: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default async function AdminOpportunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const pending = await getPendingOpportunities()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Pending Opportunities</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {pending.length} opportunit{pending.length !== 1 ? 'ies' : 'y'} awaiting review.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-zinc-400">No opportunities pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((opportunity) => (
            <AdminOpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  )
}

function AdminOpportunityCard({ opportunity }: { opportunity: OpportunityWithPoster }) {
  const postedDate = new Date(opportunity.created_at).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const deadlineLabel = opportunity.deadline
    ? new Date(opportunity.deadline).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'No deadline'

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="p-4 space-y-3">
        <div>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[opportunity.category]}`}>
            {CATEGORY_LABELS[opportunity.category]}
          </span>
          <h3 className="mt-2 text-sm font-bold text-zinc-100">{opportunity.title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">{opportunity.organization}</p>
        </div>

        <div className="rounded-lg bg-zinc-800 p-3 space-y-1">
          {opportunity.amount && (
            <p className="text-xs text-zinc-300">
              <span className="text-zinc-500">Award: </span>
              <span className="font-semibold text-emerald-400">{opportunity.amount}</span>
            </p>
          )}
          <p className="text-xs text-zinc-300">
            <span className="text-zinc-500">Deadline: </span>{deadlineLabel}
          </p>
          <p className="text-xs text-zinc-300">
            <span className="text-zinc-500">Location: </span>
            {opportunity.is_remote ? '🌍 Remote' : (opportunity.location ?? 'Not specified')}
          </p>
          <p className="text-xs text-zinc-300">
            <span className="text-zinc-500">Apply: </span>
            <a href={opportunity.apply_url} target="_blank" rel="noopener noreferrer"
              className="text-emerald-400 hover:underline break-all">
              {opportunity.apply_url}
            </a>
          </p>
        </div>

        <div className="rounded-lg bg-zinc-800 p-3">
          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">{opportunity.description}</p>
        </div>

        {opportunity.eligibility && (
          <div className="rounded-lg bg-zinc-800 p-3">
            <p className="text-xs text-zinc-500 mb-1">Eligibility:</p>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">{opportunity.eligibility}</p>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 p-2">
          {opportunity.profiles.avatar_url ? (
            <img src={opportunity.profiles.avatar_url} alt={opportunity.profiles.full_name}
              className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300 flex-shrink-0">
              {opportunity.profiles.full_name?.[0]?.toUpperCase()}
            </div>
          )}
          <p className="text-xs font-semibold text-zinc-200 truncate">{opportunity.profiles.full_name}</p>
          <p className="ml-auto flex-shrink-0 text-xs text-zinc-600">{postedDate}</p>
        </div>
      </div>

      <div className="border-t border-zinc-800 p-3 space-y-2">
        <form action={async () => {
          'use server'
          await approveOpportunity(opportunity.id)
        }}>
          <button type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </button>
        </form>
        <RejectOpportunityForm opportunityId={opportunity.id} />
      </div>
    </div>
  )
}

function RejectOpportunityForm({ opportunityId }: { opportunityId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const reason = formData.get('reason') as string
        if (!reason?.trim()) return
        await rejectOpportunity(opportunityId, reason.trim())
      }}
      className="space-y-2"
    >
      <input name="reason" type="text" placeholder="Rejection reason (required)" required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none" />
      <button type="submit"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10">
        <XCircle className="h-3.5 w-3.5" />
        Reject
      </button>
    </form>
  )
}