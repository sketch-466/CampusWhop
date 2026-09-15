import Link from 'next/link'
import { getOpportunities } from '@/lib/actions/opportunities'
import { OpportunityCard } from '@/components/shared/opportunity-card'

const CATEGORIES = [
  { value: '', label: '🌟 All' },
  { value: 'scholarship', label: '🎓 Scholarships' },
  { value: 'internship', label: '💼 Internships' },
  { value: 'grant', label: '💰 Grants' },
  { value: 'competition', label: '🏆 Competitions' },
  { value: 'free_training', label: '📚 Free Training' },
  { value: 'career_development', label: '📈 Career Dev' },
  { value: 'fellowship', label: '🌍 Fellowships' },
  { value: 'volunteer', label: '🤝 Volunteer' },
  { value: 'hackathon', label: '💻 Hackathons' },
  { value: 'mentorship', label: '🧭 Mentorship' },
  { value: 'job', label: '💼 Jobs' },
  { value: 'other', label: '📦 Other' },
]

type PageProps = {
  searchParams: Promise<{ category?: string }>
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const category = params.category ?? ''

  const opportunities = await getOpportunities(
    category ? { category } : undefined
  )

  const activeLabel = CATEGORIES.find(c => c.value === category)?.label ?? '🌟 All'

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Opportunities</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Scholarships, training, internships, fellowships and more
            </p>
          </div>
          <Link
            href="/opportunities/new"
            className="flex-shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            + Submit
          </Link>
        </div>

        {/* Category tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={cat.value ? `/opportunities?category=${cat.value}` : '/opportunities'}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="px-4 py-4">
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-3">🎯</span>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">
              No {category ? activeLabel.replace(/^[^\s]+\s/, '') : 'opportunities'} yet
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Know of one? Share it with the community.
            </p>
            <Link
              href="/opportunities/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Submit Opportunity
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600">
              {opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'} found
              {category ? ` in ${activeLabel}` : ''}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom links */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Link
          href="/opportunities/saved"
          className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg hover:border-zinc-500"
        >
          🔖 Saved
        </Link>
        <Link
          href="/opportunities/my-posts"
          className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg hover:border-zinc-500"
        >
          📋 My Posts
        </Link>
      </div>
    </div>
  )
}