/**
 * Zod validation schemas for all API request/response shapes.
 * Used for runtime validation, TypeScript inference, and API contract enforcement.
 */
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page:    z.coerce.number().int().min(1).default(1),
  limit:   z.coerce.number().int().min(1).max(48).default(12),
});

export const SortSchema = z.object({
  sortBy:  z.enum(["price", "year", "mileage", "createdAt", "viewsCount"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Car Filter Query
// ─────────────────────────────────────────────────────────────────────────────

export const CarFilterSchema = z.object({
  // Relation filters
  brand:        z.string().optional(),
  category:     z.string().optional(),
  // Attribute filters
  fuelType:     z.string().optional(),
  transmission: z.string().optional(),
  drivetrain:   z.string().optional(),
  color:        z.string().optional(),
  // Range filters
  minPrice:     z.coerce.number().min(0).optional(),
  maxPrice:     z.coerce.number().min(0).optional(),
  minYear:      z.coerce.number().int().min(1900).optional(),
  maxYear:      z.coerce.number().int().max(2030).optional(),
  maxMileage:   z.coerce.number().min(0).optional(),
  minHp:        z.coerce.number().min(0).optional(),
  maxHp:        z.coerce.number().min(0).optional(),
  seats:        z.coerce.number().int().min(1).max(10).optional(),
  // Status filters
  isFeatured:   z.coerce.boolean().optional(),
  status:       z.enum(["active", "draft", "archived", "sold"]).default("active"),
  // Search
  q:            z.string().max(200).optional(),
}).merge(PaginationSchema).merge(SortSchema);

export type CarFilter = z.infer<typeof CarFilterSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Response Schemas (for documentation / client typesafety)
// ─────────────────────────────────────────────────────────────────────────────

export const CarImageSchema = z.object({
  id:        z.number(),
  imageUrl:  z.string(),
  imageType: z.string(),
  altText:   z.string().nullable(),
  sortOrder: z.number(),
});

export const CarSpecSchema = z.object({
  engine:       z.string().nullable(),
  horsepower:   z.string().nullable(),
  torque:       z.string().nullable(),
  drivetrain:   z.string().nullable(),
  topSpeed:     z.string().nullable(),
  acceleration: z.string().nullable(),
  doors:        z.number().nullable(),
  seats:        z.number().nullable(),
  weight:       z.string().nullable(),
  fuelEconomy:  z.string().nullable(),
  emissions:    z.string().nullable(),
});

export const BrandSchema = z.object({
  id:      z.number(),
  name:    z.string(),
  slug:    z.string(),
  logoUrl: z.string().nullable(),
});

export const CategorySchema = z.object({
  id:          z.number(),
  name:        z.string(),
  slug:        z.string(),
  description: z.string().nullable(),
});

export const CarSummarySchema = z.object({
  id:            z.number(),
  slug:          z.string(),
  title:         z.string(),
  year:          z.number(),
  price:         z.bigint(),
  mileage:       z.bigint(),
  fuelType:      z.string().nullable(),
  transmission:  z.string().nullable(),
  color:         z.string().nullable(),
  isFeatured:    z.boolean(),
  isSold:        z.boolean(),
  viewsCount:    z.number(),
  brand:         BrandSchema,
  category:      CategorySchema.nullable(),
  mainImage:     CarImageSchema.nullable(),
});

export const CarDetailSchema = CarSummarySchema.extend({
  description:     z.string().nullable(),
  sourceUrl:       z.string().nullable(),
  sourceName:      z.string().nullable(),
  isPremium:       z.boolean(),
  isVerified:      z.boolean(),
  metaTitle:       z.string().nullable(),
  metaDescription: z.string().nullable(),
  publishedAt:     z.date().nullable(),
  images:          CarImageSchema.array(),
  specs:           CarSpecSchema.nullable(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data:       itemSchema.array(),
    total:      z.number(),
    page:       z.number(),
    limit:      z.number(),
    totalPages: z.number(),
    hasNext:    z.boolean(),
    hasPrev:    z.boolean(),
  });

export type CarSummary    = z.infer<typeof CarSummarySchema>;
export type CarDetail     = z.infer<typeof CarDetailSchema>;
export type BrandItem     = z.infer<typeof BrandSchema>;
export type CategoryItem  = z.infer<typeof CategorySchema>;
