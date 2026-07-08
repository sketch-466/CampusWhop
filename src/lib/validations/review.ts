import { z } from 'zod'

export const reviewSchema = z.object({
  order_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500),
  reviewer_role: z.enum(['buyer', 'seller']),
})

export type ReviewInput = z.infer<typeof reviewSchema>
