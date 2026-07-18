import { z } from 'zod'

export const opportunitySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(150),
  description: z.string().min(30, 'Description must be at least 30 characters').max(3000),
  category: z.enum(['scholarship', 'internship', 'grant', 'competition']),
  organization: z.string().min(2, 'Organization name required').max(150),
  location: z.string().max(200).optional(),
  is_remote: z.boolean().default(false),
  apply_url: z.string().url('Enter a valid URL'),
  deadline: z.string().optional(),
  eligibility: z.string().max(1000).optional(),
  amount: z.string().max(100).optional(),
})

export type OpportunityInput = z.infer<typeof opportunitySchema>