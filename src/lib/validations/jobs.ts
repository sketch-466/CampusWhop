import { z } from 'zod'

export const jobPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  company: z.string().min(2, 'Company name required').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(3000),
  job_type: z.enum(['job', 'internship', 'gig', 'ambassador', 'remote', 'freelance']),
  location: z.string().min(2).max(100).default('FUNAI Campus'),
  is_remote: z.boolean().default(false),
  apply_method: z.enum(['external', 'internal']),
  apply_url: z.string().url().optional().or(z.literal('')),
  apply_email: z.string().email().optional().or(z.literal('')),
  apply_whatsapp: z.string().optional(),
  deadline: z.string().optional(),
  is_paid: z.boolean().default(false),
  pay_range: z.string().max(100).optional(),
  requirements: z.string().max(1000).optional(),
}).refine((data) => {
  if (data.apply_method === 'external') {
    return !!(data.apply_url || data.apply_email || data.apply_whatsapp)
  }
  return true
}, {
  message: 'External application requires a URL, email, or WhatsApp number',
  path: ['apply_method'],
})

export const jobApplicationSchema = z.object({
  job_id: z.string().uuid(),
  cover_letter: z.string().min(50, 'Cover letter must be at least 50 characters').max(1000),
})

export type JobPostInput = z.infer<typeof jobPostSchema>
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>
