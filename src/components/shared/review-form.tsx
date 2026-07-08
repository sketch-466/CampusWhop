'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from './star-rating'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitReview } from '@/lib/actions/reviews'

interface ReviewFormProps {
  orderId: string
  revieweeId: string
  revieweeName: string
  reviewerRole: 'buyer' | 'seller'
}

export function ReviewForm({
  orderId,
  revieweeId,
  revieweeName,
  reviewerRole,
}: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    if (comment.length < 10) {
      setError('Review must be at least 10 characters')
      return
    }

    setLoading(true)
    setError(undefined)

    const result = await submitReview({
      order_id: orderId,
      reviewee_id: revieweeId,
      rating,
      comment,
      reviewer_role: reviewerRole,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-4">
        <p className="text-sm text-emerald-400">
          ✓ Review submitted successfully
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
      <p className="text-sm font-medium text-white">
        Rate your experience with {revieweeName}
      </p>
      <StarRating value={rating} onChange={setRating} />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{comment.length}/500</span>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading}
        size="sm"
        className="bg-emerald-500 hover:bg-emerald-600"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </div>
  )
}
