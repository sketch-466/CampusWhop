import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  price: z.number().min(100, 'Minimum price is ₦100'),
  product_type: z.enum(['physical', 'digital']),
  category: z.enum(['phones', 'laptops', 'books', 'gadgets', 'services', 'notes', 'templates', 'ebooks', 'designs', 'other']),
  delivery_note: z.string().max(500).optional(),
  payment_type: z.enum(['escrow', 'direct']).default('escrow'),
});

export type ListingInput = z.infer<typeof listingSchema>;