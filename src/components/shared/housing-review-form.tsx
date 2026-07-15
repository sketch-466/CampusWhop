'use client'

import { useState } from 'react'
import { StarRating } from '@/components/shared/star-rating'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createHousingReview } from '@/lib/actions/housing'

type HousingReviewFormProps = {
  listingId: string
  onSuccess: () => void
}

export function HousingReviewForm({ listingId, onSuccess }: HousingReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createHousingReview({ listing_id: listingId, rating, comment: comment.trim() })
      setRating(0)
      setComment('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-100">Leave a Review</h3>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">Your Rating</Label>
        <StarRating value={rating} onChange={setRating} interactive />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment" className="text-xs text-zinc-400">
          Your Experience
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was living here? Tell future tenants what to expect..."
          rows={4}
          className="resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 text-sm"
        />
        <p className="text-xs text-zinc-600 text-right">{comment.length}/1000</p>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </div>
  )
}