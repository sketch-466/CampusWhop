import Link from 'next/link'
import type { OpportunityWithPoster } from '@/types/database'

const CATEGORY_STYLES: Record<string, string> = {
  scholarship: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  grant: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  competition: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: 'Scholarship',
  internship: 'Internship',
  grant: 'Grant',
  competition: 'Competition',
}

type OpportunityCardProps = {
  opportunity: OpportunityWithPoster
  isSaved?: boolean
}

function getDeadlineInfo(deadline: string | null): {
  label: string
  urgent: boolean
} {
  if (!deadline) return { label: 'No deadline', urgent: false }

  const deadlineDate = new Date(deadline)
  const today = new Date()
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysLeft < 0) return { label: 'Expired', urgent: true }
  if (daysLeft === 0) return { label: 'Closes today', urgent: true }
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, urgent: true }

  return {
    label: `Closes ${deadlineDate.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`,
    urgent: false,
  }
}

export function OpportunityCard({ opportunity, isSaved = false }: OpportunityCardProps) {
  const { label: deadlineLabel, urgent } = getDeadlineInfo(opportunity.deadline)

  return (
    <Link href={`/opportunities/${opportunity.id}`} className="block">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 transition-colors hover:border-zinc-700">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
              CATEGORY_STYLES[opportunity.category]
            }`}
          >
            {CATEGORY_LABELS[opportunity.category]}
          </span>
          {isSaved && (
            <span className="text-emerald-400 text-sm">🔖</span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 leading-tight line-clamp-2">
            {opportunity.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{opportunity.organization}</p>
        </div>

        {/* Amount */}
        {opportunity.amount && (
          <p className="text-sm font-bold text-emerald-400">{opportunity.amount}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {opportunity.is_remote ? (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                🌍 Remote
              </span>
            ) : opportunity.location ? (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 truncate max-w-[120px]">
                📍 {opportunity.location}
              </span>
            ) : null}
          </div>

          <span
            className={`flex-shrink-0 text-xs font-medium ${
              urgent ? 'text-red-400' : 'text-zinc-500'
            }`}
          >
            {urgent && '⚡ '}{deadlineLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}