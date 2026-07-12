import { z } from 'zod'

const baseHousingSchema = z.object({
  poster_role: z.enum(['student', 'landlord', 'agent']),
  listing_type: z.enum([
    'hostel',
    'self_contain',
    'shared_apartment',
    'roommate_wanted',
  ]),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be under 120 characters'),
  description: z
    .string()
    .min(30, 'Description must be at least 30 characters')
    .max(2000, 'Description must be under 2000 characters'),
  university: z.string().default('FUNAI'),
  location_area: z
    .string()
    .min(2, 'Location area is required')
    .max(100),
  distance_to_campus_mins: z
    .union([z.number().int().min(1).max(120), z.nan(), z.null()])
    .optional()
    .transform((v) => (typeof v === 'number' && !isNaN(v) ? v : null)),
  room_type: z.string().max(50).optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
})

export const housingSchema = baseHousingSchema
  .extend({
    price: z.number().positive().optional(),
    price_period: z
      .enum(['per_session', 'per_month', 'per_year'])
      .optional(),
    budget_min: z.number().positive().optional(),
    budget_max: z.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.listing_type === 'roommate_wanted') {
      if (data.budget_min === undefined || data.budget_min === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Budget minimum is required for roommate wanted listings',
          path: ['budget_min'],
        })
      }
      if (data.budget_max === undefined || data.budget_max === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Budget maximum is required for roommate wanted listings',
          path: ['budget_max'],
        })
      }
      if (
        data.budget_min !== undefined &&
        data.budget_max !== undefined &&
        data.budget_max < data.budget_min
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Budget maximum must be greater than or equal to budget minimum',
          path: ['budget_max'],
        })
      }
      if (data.price !== undefined && data.price !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price should not be set for roommate wanted listings',
          path: ['price'],
        })
      }
      if (data.price_period !== undefined && data.price_period !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price period should not be set for roommate wanted listings',
          path: ['price_period'],
        })
      }
    } else {
      if (data.price === undefined || data.price === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price is required for this listing type',
          path: ['price'],
        })
      }
      if (!data.price_period) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price period is required for this listing type',
          path: ['price_period'],
        })
      }
      if (data.budget_min !== undefined && data.budget_min !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Budget fields should not be set for this listing type',
          path: ['budget_min'],
        })
      }
      if (data.budget_max !== undefined && data.budget_max !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Budget fields should not be set for this listing type',
          path: ['budget_max'],
        })
      }
    }
  })

export type HousingInput = z.infer<typeof housingSchema>
