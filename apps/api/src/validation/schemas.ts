import { z } from 'zod';

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional()
});

// Property search schemas
export const PropertySearchSchema = z.object({
  location: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minBedrooms: z.coerce.number().int().min(0).optional(),
  maxBedrooms: z.coerce.number().int().min(0).optional(),
  minBathrooms: z.coerce.number().min(0).optional(),
  maxBathrooms: z.coerce.number().min(0).optional(),
  minArea: z.coerce.number().min(0).optional(),
  maxArea: z.coerce.number().min(0).optional(),
  propertyType: z.enum(['house', 'apartment', 'condo', 'commercial', 'land']).optional(),
  transactionType: z.enum(['rent', 'sale']).optional(),
  features: z.array(z.string()).optional(),
  sortBy: z.enum(['price', 'date', 'area', 'bedrooms']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// AI search schema
export const AISearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long')
});

// Contact inquiry schema
export const ContactInquirySchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10).max(20).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message too long')
});

// Admin schemas
export const TriggerScrapingSchema = z.object({
  provider: z.enum(['scrapedo', 'mercadolibre', 'lamudi', 'vivanuncios', 'all']),
  location: z.string().min(1).max(100).optional()
});

export const UpdatePropertySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area_sqm: z.number().min(0).optional(),
  description: z.string().optional()
});

// Type exports
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PropertySearchInput = z.infer<typeof PropertySearchSchema>;
export type AISearchInput = z.infer<typeof AISearchSchema>;
export type ContactInquiryInput = z.infer<typeof ContactInquirySchema>;
export type TriggerScrapingInput = z.infer<typeof TriggerScrapingSchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;