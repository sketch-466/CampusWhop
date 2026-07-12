'use server'

import { createClient } from '@/lib/supabase/server'
import { housingSchema } from '@/lib/validations/housing'
import { revalidatePath } from 'next/cache'

interface CreateHousingResult {
  success: boolean
  listingId?: string
  error?: string
}

export async function createHousingListing(
  formData: FormData
): Promise<CreateHousingResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to post a listing' }
  }

  const rawData = {
    poster_role: formData.get('poster_role') as string,
    listing_type: formData.get('listing_type') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    university: (formData.get('university') as string) || 'FUNAI',
    location_area: formData.get('location_area') as string,
    distance_to_campus_mins: formData.get('distance_to_campus_mins')
      ? parseInt(formData.get('distance_to_campus_mins') as string, 10)
      : null,
    room_type: (formData.get('room_type') as string) || undefined,
    amenities: JSON.parse((formData.get('amenities') as string) || '[]'),
    images: JSON.parse((formData.get('images') as string) || '[]'),
    price: formData.get('price')
      ? parseFloat(formData.get('price') as string)
      : undefined,
    price_period: (formData.get('price_period') as string) || undefined,
    budget_min: formData.get('budget_min')
      ? parseFloat(formData.get('budget_min') as string)
      : undefined,
    budget_max: formData.get('budget_max')
      ? parseFloat(formData.get('budget_max') as string)
      : undefined,
  }

  const parsed = housingSchema.safeParse(rawData)

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return {
      success: false,
      error: `${firstError.path.join('.')}: ${firstError.message}`,
    }
  }

  const data = parsed.data

  const insertData: Record<string, unknown> = {
    poster_id: user.id,
    status: 'pending',
    poster_role: data.poster_role,
    listing_type: data.listing_type,
    title: data.title,
    description: data.description,
    university: data.university,
    location_area: data.location_area,
    distance_to_campus_mins: data.distance_to_campus_mins,
    room_type: data.room_type || null,
    amenities: data.amenities,
    images: data.images,
  }

  if (data.listing_type === 'roommate_wanted') {
    insertData.budget_min = data.budget_min
    insertData.budget_max = data.budget_max
    insertData.price = null
    insertData.price_period = null
  } else {
    insertData.price = data.price
    insertData.price_period = data.price_period
    insertData.budget_min = null
    insertData.budget_max = null
  }

  const { data: listing, error: insertError } = await supabase
    .from('housing_listings')
    .insert(insertData)
    .select('id')
    .single()

  if (insertError) {
    console.error('Housing insert error:', insertError)
    return {
      success: false,
      error: 'Failed to create listing. Please try again.',
    }
  }

  revalidatePath('/housing')
  revalidatePath('/housing/my-listings')

  return { success: true, listingId: listing.id }
}

export async function uploadHousingImage(formData: FormData) {
  const file = formData.get('image') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, and WEBP images are allowed' }
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { success: false, error: 'File must be less than 5MB' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  const filePath = `${user.id}/housing/${timestamp}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('housing-images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return { success: false, error: 'Failed to upload image' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('housing-images').getPublicUrl(filePath)

  return { success: true, url: publicUrl }
}

interface SubmitReviewResult {
  success: boolean
  error?: string
}

export async function submitHousingReview(
  listingId: string,
  rating: number,
  comment: string
): Promise<SubmitReviewResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to leave a review' }
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5' }
  }

  const trimmedComment = comment.trim()
  if (trimmedComment.length > 500) {
    return { success: false, error: 'Comment must be under 500 characters' }
  }

  const { data: listing, error: listingError } = await supabase
    .from('housing_listings')
    .select('poster_id')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return { success: false, error: 'Listing not found' }
  }

  if (user.id === listing.poster_id) {
    return { success: false, error: "You can't review your own listing" }
  }

  const { error: insertError } = await supabase.from('housing_reviews').insert({
    listing_id: listingId,
    reviewer_id: user.id,
    reviewee_id: listing.poster_id,
    rating,
    comment: trimmedComment || null,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: "You've already reviewed this listing" }
    }
    console.error('Housing review insert error:', insertError)
    return { success: false, error: 'Failed to submit review. Please try again.' }
  }

  revalidatePath(`/housing/${listingId}`)
  return { success: true }
}

export async function hasReviewedHousingListing(listingId: string): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from('housing_reviews')
    .select('id')
    .eq('listing_id', listingId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  return !!data
}

export async function getHousingReviewsForUser(userId: string) {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('housing_reviews')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      reviewer:profiles!housing_reviews_reviewer_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq('reviewee_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Get housing reviews error:', error)
    return []
  }

  return (
    reviews?.map((review) => {
      const reviewer = Array.isArray(review.reviewer)
        ? review.reviewer[0]
        : review.reviewer
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        reviewer: {
          id: reviewer?.id || '',
          fullName: reviewer?.full_name || 'Unknown',
          avatarUrl: reviewer?.avatar_url,
        },
      }
    }) ?? []
  )
}
