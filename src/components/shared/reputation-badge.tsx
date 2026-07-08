import { Star } from 'lucide-react'

interface ReputationBadgeProps {
  score: number
  totalReviews: number
  size?: 'sm' | 'md'
}

export function ReputationBadge({
  score,
  totalReviews,
  size = 'sm',
}: ReputationBadgeProps) {
  if (totalReviews === 0) {
    return <span className="text-xs text-zinc-500">No reviews yet</span>
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      <Star
        className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400`}
      />
      <span className="text-yellow-400 font-medium">{score.toFixed(1)}</span>
      <span className="text-zinc-500">({totalReviews})</span>
    </span>
  )
}
