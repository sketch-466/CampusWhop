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

  // Parse form data
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
