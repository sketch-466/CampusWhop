import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canReviewOrder, getReviewForOrder } from '@/lib/actions/reviews'
import { ReviewForm } from '@/components/shared/review-form'
import { StarRating } from '@/components/shared/star-rating'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ReviewPageProps {
  params: Promise<{ orderId: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
      id,
      status,
      amount,
      buyer_id,
      seller_id,
      listing:listings (
        id,
        title,
        images
      ),
      buyer:profiles!orders_buyer_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      seller:profiles!orders_seller_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    notFound()
  }

  const { canReview, role, alreadyReviewed } = await canReviewOrder(orderId)

  if (!canReview && !alreadyReviewed) {
    redirect('/orders')
  }

  const existingReview = alreadyReviewed
    ? await getReviewForOrder(orderId)
    : null

  const isBuyer = order.buyer_id === user.id
  const reviewee = isBuyer ? order.seller : order.buyer
  const revieweeName = reviewee?.full_name || 'the other party'

  const listingImages = (order.listing?.images as string[]) || []
  const firstImage = listingImages[0] || '/placeholder-listing.jpg'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Leave a Review</h1>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
            <Image
              src={firstImage}
              alt={order.listing?.title || 'Listing'}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {order.listing?.title || 'Untitled Listing'}
            </p>
            <p className="text-sm text-zinc-400">
              ${order.amount?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-emerald-400 mt-1">✓ Completed</p>
          </div>
        </div>
      </div>

      {alreadyReviewed && existingReview ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
          <p className="text-sm font-medium text-white">
            You already reviewed {revieweeName}
          </p>
          <StarRating value={existingReview.rating} readonly />
          <p className="text-sm text-zinc-300">{existingReview.comment}</p>
          <p className="text-xs text-zinc-500">
            Submitted on{' '}
            {new Date(existingReview.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : canReview && role ? (
        <ReviewForm
          orderId={orderId}
          revieweeId={reviewee?.id || ''}
          revieweeName={revieweeName}
          reviewerRole={role}
        />
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
          <p className="text-sm text-zinc-400">
            You cannot leave a review for this order.
          </p>
        </div>
      )}
    </div>
  )
}
