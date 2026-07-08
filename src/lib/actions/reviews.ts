'use server'

import { createClient } from '@/lib/supabase/server'
import { reviewSchema, type ReviewInput } from '@/lib/validations/review'
import { revalidatePath } from 'next/cache'

export async function submitReview(data: ReviewInput) {
  const supabase = await createClient()

  const parsed = reviewSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to submit a review' }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, buyer_id, seller_id')
    .eq('id', data.order_id)
    .single()

  if (orderError || !order) {
    return { error: 'Order not found' }
  }

  if (order.status !== 'completed') {
    return { error: 'Order must be completed before reviewing' }
  }

  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id

  if (!isBuyer && !isSeller) {
    return { error: 'You can only review orders you participated in' }
  }

  const expectedRole = isBuyer ? 'buyer' : 'seller'
  if (data.reviewer_role !== expectedRole) {
    return { error: 'Invalid reviewer role for this order' }
  }

  const expectedRevieweeId = isBuyer ? order.seller_id : order.buyer_id
  if (data.reviewee_id !== expectedRevieweeId) {
    return { error: 'You can only review the other party in this order' }
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', data.order_id)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existingReview) {
    return { error: 'You have already reviewed this order' }
  }

  const { error: insertError } = await supabase.from('reviews').insert({
    order_id: data.order_id,
    reviewer_id: user.id,
    reviewee_id: data.reviewee_id,
    rating: data.rating,
    comment: data.comment,
    reviewer_role: data.reviewer_role,
  })

  if (insertError) {
    console.error('Review insert error:', insertError)
    return { error: 'Failed to submit review. Please try again.' }
  }

  revalidatePath('/orders')
  revalidatePath('/profile')
  revalidatePath(`/reviews/${data.order_id}`)
  revalidatePath('/marketplace')

  return { success: true }
}

export async function getReviewsForUser(userId: string) {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(
      `
      id,
      rating,
      comment,
      reviewer_role,
      created_at,
      reviewer:profiles!reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get reviews error:', error)
    return []
  }

  return (
    reviews?.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewerRole: review.reviewer_role,
      createdAt: review.created_at,
      reviewer: {
        id: review.reviewer.id,
        fullName: review.reviewer.full_name,
        avatarUrl: review.reviewer.avatar_url,
      },
    })) ?? []
  )
}

export async function getReviewForOrder(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('order_id', orderId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (error || !review) {
    return null
  }

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
  }
}

export async function canReviewOrder(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { canReview: false, role: null as 'buyer' | 'seller' | null, alreadyReviewed: false }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, buyer_id, seller_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { canReview: false, role: null as 'buyer' | 'seller' | null, alreadyReviewed: false }
  }

  if (order.status !== 'completed') {
    return { canReview: false, role: null as 'buyer' | 'seller' | null, alreadyReviewed: false }
  }

  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id

  if (!isBuyer && !isSeller) {
    return { canReview: false, role: null as 'buyer' | 'seller' | null, alreadyReviewed: false }
  }

  const role = isBuyer ? ('buyer' as const) : ('seller' as const)

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  return {
    canReview: !existingReview,
    role,
    alreadyReviewed: !!existingReview,
  }
}
