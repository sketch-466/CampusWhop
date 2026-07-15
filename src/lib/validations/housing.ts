import { z } from 'zod'

export const housingListingSchema = z.object({
  poster_type: z.enum(['landlord', 'agent', 'student']),
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  description: z.string().min(30, 'Description must be at least 30 characters').max(2000),
  location: z.string().min(3, 'Location required').max(200),
  university: z.string().min(3, 'University required').max(100),
  price_per_year: z.number().int().min(10000, 'Minimum price is ₦10,000').max(10000000),
  room_type: z.enum(['self_con', 'shared_room', 'mini_flat', 'flat', 'duplex']),
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
  images: z.array(z.string().url()).min(1, 'At least one photo required').max(6),
  available_rooms: z.number().int().min(1).max(999),
  whatsapp_number: z.string().min(11, 'Enter a valid WhatsApp number').max(15),
})

export const roommateListingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100),
  description: z.string().min(20, 'Tell us more about yourself').max(1000),
  location: z.string().min(3, 'Location required').max(200),
  university: z.string().min(3, 'University required').max(100),
  budget_per_year: z.number().int().min(10000, 'Minimum budget is ₦10,000').max(10000000),
  preferred_gender: z.enum(['male', 'female', 'any']),
  move_in_date: z.string().min(1, 'Move-in date required'),
  whatsapp_number: z.string().min(11, 'Enter a valid WhatsApp number').max(15),
})

export const housingReviewSchema = z.object({
  listing_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Write at least 10 characters').max(1000),
})

export type HousingListingInput = z.infer<typeof housingListingSchema>
export type RoommateListingInput = z.infer<typeof roommateListingSchema>
export type HousingReviewInput = z.infer<typeof housingReviewSchema>