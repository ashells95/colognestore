const { z } = require('zod');

const noteSchema = z.array(z.string().trim().min(1).max(60)).max(20);
const imageUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((url) => new URL(url).protocol === 'https:', {
    message: 'Image URLs must use HTTPS.',
  });
const variantSchema = z
  .object({
    sku: z.string().trim().min(1).max(64),
    sizeMl: z.coerce.number().positive().max(2000),
    concentration: z.enum(['EDT', 'EDP', 'Parfum', 'Elixir']),
    priceCents: z.coerce.number().int().positive(),
    compareAtPriceCents: z.coerce.number().int().positive().optional(),
    stock: z.coerce.number().int().min(0).max(100000),
  })
  .strict()
  .refine(
    (variant) =>
      variant.compareAtPriceCents === undefined ||
      variant.compareAtPriceCents >= variant.priceCents,
    { path: ['compareAtPriceCents'], message: 'Must not be lower than the current price.' },
  );

const characteristicsSchema = z
  .array(z.enum(['fresh', 'woody', 'spicy', 'sweet', 'floral', 'amber', 'citrus', 'musk']))
  .max(8);
const imagesSchema = z
  .array(
    z
      .object({
        url: imageUrlSchema,
        altText: z.string().trim().min(1).max(200),
      })
      .strict(),
  )
  .max(10);

const productFields = {
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).optional(),
  brand: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(5000),
  gender: z.enum(['men', 'women', 'unisex']),
  fragranceFamily: z.string().trim().min(1).max(60),
  topNotes: noteSchema,
  heartNotes: noteSchema,
  baseNotes: noteSchema,
  characteristics: characteristicsSchema,
  images: imagesSchema,
  variants: z.array(variantSchema).min(1).max(30),
  featured: z.boolean(),
  active: z.boolean(),
};

const productSchema = z
  .object({
    ...productFields,
    topNotes: noteSchema.default([]),
    heartNotes: noteSchema.default([]),
    baseNotes: noteSchema.default([]),
    characteristics: characteristicsSchema.default([]),
    images: imagesSchema.default([]),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .strict();

const productUpdateSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((update) => Object.keys(update).length > 0, {
    message: 'At least one product field must be provided.',
  });

const productQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    brand: z.string().trim().max(100).optional(),
    gender: z.enum(['men', 'women', 'unisex']).optional(),
    fragranceFamily: z.string().trim().max(60).optional(),
    concentration: z.enum(['EDT', 'EDP', 'Parfum', 'Elixir']).optional(),
    sizeMl: z.coerce.number().positive().optional(),
    minPriceCents: z.coerce.number().int().min(0).optional(),
    maxPriceCents: z.coerce.number().int().min(0).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    featured: z.enum(['true', 'false']).optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'name-asc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict()
  .refine(
    (query) =>
      query.minPriceCents === undefined ||
      query.maxPriceCents === undefined ||
      query.minPriceCents <= query.maxPriceCents,
    { path: ['minPriceCents'], message: 'Minimum price cannot exceed maximum price.' },
  );

const productParamsSchema = z
  .object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID.') })
  .strict();

module.exports = {
  productParamsSchema,
  productQuerySchema,
  productSchema,
  productUpdateSchema,
};
