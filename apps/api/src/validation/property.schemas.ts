import { z } from 'zod';

// Common schemas
const PriceRangeSchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional()
}).refine(data => {
  if (data.min && data.max) {
    return data.min <= data.max;
  }
  return true;
}, { message: 'Min price must be less than or equal to max price' });

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const PropertyTypeEnum = z.enum(['house', 'apartment', 'condo', 'commercial', 'land']);
const TransactionTypeEnum = z.enum(['sale', 'rent']);

// Search filters schema
export const PropertySearchSchema = z.object({
  // Location filters
  country: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid zip code format').optional(),
  
  // Property filters
  propertyType: PropertyTypeEnum.optional(),
  transactionType: TransactionTypeEnum.optional(),
  
  // Price filters
  minPrice: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).optional()
  ),
  maxPrice: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).optional()
  ),
  
  // Size filters
  minBedrooms: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().int().min(0).max(20).optional()
  ),
  maxBedrooms: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().int().min(0).max(20).optional()
  ),
  minBathrooms: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).max(20).optional()
  ),
  maxBathrooms: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).max(20).optional()
  ),
  minArea: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).optional()
  ),
  maxArea: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().min(0).optional()
  ),
  
  // Pagination
  page: z.preprocess(
    (val) => val ? Number(val) : 1,
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => val ? Number(val) : 20,
    z.number().int().min(1).max(100).default(20)
  ),
  
  // Sorting
  sortBy: z.enum(['price', 'date', 'area', 'bedrooms']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate price range
  if (data.minPrice && data.maxPrice && data.minPrice > data.maxPrice) {
    return false;
  }
  // Validate bedroom range
  if (data.minBedrooms && data.maxBedrooms && data.minBedrooms > data.maxBedrooms) {
    return false;
  }
  // Validate bathroom range
  if (data.minBathrooms && data.maxBathrooms && data.minBathrooms > data.maxBathrooms) {
    return false;
  }
  // Validate area range
  if (data.minArea && data.maxArea && data.minArea > data.maxArea) {
    return false;
  }
  return true;
}, {
  message: 'Invalid range: min value must be less than or equal to max value'
});

// Create property schema
export const CreatePropertySchema = z.object({
  source: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  state_province: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  neighborhood: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  address: z.string().min(1).max(500),
  coordinates: CoordinatesSchema,
  transaction_type: TransactionTypeEnum,
  price: z.object({
    amount: z.number().min(0),
    currency: z.string().length(3).default('MXN')
  }),
  property_type: PropertyTypeEnum,
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().min(0).max(50),
  area_sqm: z.number().min(0),
  lot_size_sqm: z.number().min(0).optional().nullable(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  description: z.string().max(5000).optional(),
  contact_info: z.string().max(500).optional()
});

// Update property schema (partial)
export const UpdatePropertySchema = CreatePropertySchema.partial();

// Property ID schema
export const PropertyIdSchema = z.object({
  id: z.string().uuid('Invalid property ID format')
});

// Location params schema
export const LocationParamsSchema = z.object({
  country: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional()
});

// Type exports
export type PropertySearch = z.infer<typeof PropertySearchSchema>;
export type CreateProperty = z.infer<typeof CreatePropertySchema>;
export type UpdateProperty = z.infer<typeof UpdatePropertySchema>;
export type PropertyId = z.infer<typeof PropertyIdSchema>;