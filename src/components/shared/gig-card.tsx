import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ReputationBadge } from './reputation-badge'
import { MapPin, Clock, Banknote } from 'lucide-react'

interface GigCardProps {
  gig: {
    id: string
    title: string
    company: string
    job_type: string
    location: string
    is_remote: boolean
    is_paid: boolean
    pay_range: string | null
    deadline: string | null
    poster: {
      full_name: string | null
      avatar_url: string | null
      reputation_score: number | null
      total_reviews: number | null
    } | null
  }
}

export function GigCard({ gig }: GigCardProps) {
  const gigTypeLabels: Record<string, string> = {
    job: 'Part-time',
    internship: 'Internship',
    gig: 'One-time Gig',
    ambassador: 'Ambassador',
    remote: 'Remote',
    freelance: 'Freelance',
  }

  const gigTypeColors: Record<string, 'default' | 'success' | 'warning' | 'outline'> = {
    job: 'default',
    internship: 'success',
    gig: 'warning',
    ambassador: 'success',
    remote: 'outline',
    freelance: 'outline',
  }

  const isExpired = gig.deadline && new Date(gig.deadline) < new Date()

  return (
    <Link
      href={`/gigs/${gig.id}`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={gigTypeColors[gig.job_type] || 'default'}>
              {gigTypeLabels[gig.job_type] || gig.job_type}
            </Badge>
            {gig.is_remote && (
              <Badge variant="outline">Remote</Badge>
            )}
            {gig.is_paid && (
              <Badge variant="success">Paid</Badge>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-white group-hover:text-emerald-400 transition-colors">
            {gig.title}
          </h3>
          <p className="text-sm text-zinc-400">{gig.company}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {gig.location}
        </span>
        {gig.pay_range && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Banknote className="h-3 w-3" />
            {gig.pay_range}
          </span>
        )}
        {gig.deadline && (
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : ''}`}>
            <Clock className="h-3 w-3" />
            {isExpired
              ? 'Expired'
              : `Deadline: ${new Date(gig.deadline).toLocaleDateString()}`}
          </span>
        )}
      </div>

      {gig.poster && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            by {gig.poster.full_name || 'Unknown'}
          </span>
          <ReputationBadge
            score={gig.poster.reputation_score || 0}
            totalReviews={gig.poster.total_reviews || 0}
          />
        </div>
      )}
    </Link>
  )
}