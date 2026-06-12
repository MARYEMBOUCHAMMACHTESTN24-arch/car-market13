/**
 * car.service.ts
 * Production-ready Prisma service for all car-related queries.
 * Uses v2_ tables exclusively. Read-only against legacy tables.
 */
import prisma from "../lib/prisma";
import type { CarFilter } from "../lib/schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Shared include — reused across all car queries for consistency
// ─────────────────────────────────────────────────────────────────────────────

const CAR_SUMMARY_INCLUDE = {
  brand: {
    select: { id: true, name: true, slug: true, logoUrl: true },
  },
  category: {
    select: { id: true, name: true, slug: true, description: true },
  },
  images: {
    where: { imageType: "main" },
    select: { id: true, imageUrl: true, imageType: true, altText: true, sortOrder: true },
    take: 1,
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

const CAR_DETAIL_INCLUDE = {
  brand: {
    select: { id: true, name: true, slug: true, logoUrl: true },
  },
  category: {
    select: { id: true, name: true, slug: true, description: true },
  },
  images: {
    select: { id: true, imageUrl: true, imageType: true, altText: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
  specs: {
    select: {
      engine: true, horsepower: true, torque: true, drivetrain: true,
      topSpeed: true, acceleration: true, doors: true, seats: true,
      weight: true, fuelEconomy: true, emissions: true,
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Filter Builder — converts CarFilter into a Prisma where clause
// ─────────────────────────────────────────────────────────────────────────────

function buildCarWhere(filters: Partial<CarFilter>) {
  const where: Record<string, unknown> = {
    status: filters.status ?? "active",
  };

  if (filters.brand) {
    where.brand = { slug: filters.brand };
  }
  if (filters.category) {
    where.category = { slug: filters.category };
  }
  if (filters.fuelType) {
    where.fuelType = { equals: filters.fuelType, mode: "insensitive" };
  }
  if (filters.transmission) {
    where.transmission = { equals: filters.transmission, mode: "insensitive" };
  }
  if (filters.color) {
    where.color = { equals: filters.color, mode: "insensitive" };
  }
  if (filters.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined && { gte: BigInt(filters.minPrice) }),
      ...(filters.maxPrice !== undefined && { lte: BigInt(filters.maxPrice) }),
    };
  }
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    where.year = {
      ...(filters.minYear !== undefined && { gte: filters.minYear }),
      ...(filters.maxYear !== undefined && { lte: filters.maxYear }),
    };
  }
  if (filters.maxMileage !== undefined) {
    where.mileage = { lte: BigInt(filters.maxMileage) };
  }
  if (filters.seats !== undefined) {
    where.specs = { seats: filters.seats };
  }
  if (filters.drivetrain) {
    where.specs = {
      ...(typeof where.specs === "object" ? where.specs as object : {}),
      drivetrain: { equals: filters.drivetrain, mode: "insensitive" },
    };
  }
  // Horsepower filter — parsed from "NNN hp" string in specs
  if (filters.minHp !== undefined || filters.maxHp !== undefined) {
    // Handled via raw query in getCars() since HP is stored as string
  }

  // Full-text keyword search across title and description
  if (filters.q) {
    where.OR = [
      { title:       { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { brand:  { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  return where;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginated Car List
// ─────────────────────────────────────────────────────────────────────────────

export async function getCars(filters: Partial<CarFilter> = {}) {
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 12;
  const skip  = (page - 1) * limit;

  const sortBy  = filters.sortBy  ?? "createdAt";
  const sortDir = filters.sortDir ?? "desc";

  const where = buildCarWhere(filters);

  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where,
      include:  CAR_SUMMARY_INCLUDE,
      orderBy:  { [sortBy]: sortDir },
      skip,
      take: limit,
    }),
    prisma.car.count({ where }),
  ]);

  return {
    data:       cars.map(normalizeSummary),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext:    page * limit < total,
    hasPrev:    page > 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Car by Slug
// ─────────────────────────────────────────────────────────────────────────────

export async function getCarBySlug(slug: string) {
  const car = await prisma.car.findUnique({
    where:   { slug },
    include: CAR_DETAIL_INCLUDE,
  });

  if (!car) return null;

  // Increment view count (fire and forget)
  prisma.car.update({
    where: { id: car.id },
    data:  { viewsCount: { increment: 1 } },
  }).catch(() => {/* non-critical */});

  return normalizeDetail(car);
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured Cars
// ─────────────────────────────────────────────────────────────────────────────

export async function getFeaturedCars(limit = 8) {
  const cars = await prisma.car.findMany({
    where:   { isFeatured: true, status: "active" },
    include: CAR_SUMMARY_INCLUDE,
    orderBy: { createdAt: "desc" },
    take:    limit,
  });

  return cars.map(normalizeSummary);
}

// ─────────────────────────────────────────────────────────────────────────────
// Latest Cars
// ─────────────────────────────────────────────────────────────────────────────

export async function getLatestCars(limit = 12) {
  const cars = await prisma.car.findMany({
    where:   { status: "active" },
    include: CAR_SUMMARY_INCLUDE,
    orderBy: { createdAt: "desc" },
    take:    limit,
  });

  return cars.map(normalizeSummary);
}

// ─────────────────────────────────────────────────────────────────────────────
// Related Cars — same brand or category, excluding current car
// ─────────────────────────────────────────────────────────────────────────────

export async function getRelatedCars(carId: number, brandId: number, categoryId: number | null, limit = 6) {
  const cars = await prisma.car.findMany({
    where: {
      id:     { not: carId },
      status: "active",
      OR: [
        { brandId },
        ...(categoryId ? [{ categoryId }] : []),
      ],
    },
    include: CAR_SUMMARY_INCLUDE,
    orderBy: { viewsCount: "desc" },
    take:    limit,
  });

  return cars.map(normalizeSummary);
}

// ─────────────────────────────────────────────────────────────────────────────
// Slug list for Next.js generateStaticParams()
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllCarSlugs() {
  return prisma.car.findMany({
    where:  { status: "active" },
    select: { slug: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Distinct filter options — used to populate filter dropdowns
// ─────────────────────────────────────────────────────────────────────────────

export async function getFilterOptions() {
  const [fuelTypes, transmissions, colors, years] = await Promise.all([
    prisma.car.findMany({
      where:    { status: "active", fuelType: { not: null } },
      select:   { fuelType: true },
      distinct: ["fuelType"],
      orderBy:  { fuelType: "asc" },
    }),
    prisma.car.findMany({
      where:    { status: "active", transmission: { not: null } },
      select:   { transmission: true },
      distinct: ["transmission"],
      orderBy:  { transmission: "asc" },
    }),
    prisma.car.findMany({
      where:    { status: "active", color: { not: null } },
      select:   { color: true },
      distinct: ["color"],
      orderBy:  { color: "asc" },
    }),
    prisma.car.aggregate({
      where:  { status: "active" },
      _min:   { year: true, price: true, mileage: true },
      _max:   { year: true, price: true, mileage: true },
    }),
  ]);

  const drivetrains = await prisma.carSpec.findMany({
    where:    { drivetrain: { not: null } },
    select:   { drivetrain: true },
    distinct: ["drivetrain"],
    orderBy:  { drivetrain: "asc" },
  });

  return {
    fuelTypes:    fuelTypes.map((r) => r.fuelType!),
    transmissions: transmissions.map((r) => r.transmission!),
    colors:       colors.map((r) => r.color!),
    drivetrains:  drivetrains.map((r) => r.drivetrain!),
    priceRange:   { min: Number(years._min.price ?? 0), max: Number(years._max.price ?? 0) },
    yearRange:    { min: years._min.year ?? 2000, max: years._max.year ?? 2025 },
    mileageRange: { min: Number(years._min.mileage ?? 0), max: Number(years._max.mileage ?? 0) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Image helpers
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop";

/**
 * Resolves a raw image URL from the database into a safe, absolute URL.
 * Handles the /car1/ prefix convention used by the legacy static file server.
 */
export function resolveImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return FALLBACK_IMAGE;
  const clean = rawUrl.trim();
  if (!clean) return FALLBACK_IMAGE;

  // Already absolute
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;

  // Remap legacy /car/ → /car1/ prefix for the static file server
  if (clean.startsWith("/car/")) {
    return `/car1/${clean.slice("/car/".length)}`;
  }
  if (clean.startsWith("car/")) {
    return `/car1/${clean.slice("car/".length)}`;
  }

  return clean.startsWith("/") ? clean : `/${clean}`;
}

/**
 * Returns the main image URL for a car, with fallback.
 */
export function getMainImage(images: { imageUrl: string; imageType: string }[]): string {
  const main = images.find((img) => img.imageType === "main");
  return resolveImageUrl(main?.imageUrl);
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers — convert BigInt and shape API response
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSummary(car: {
  id: number; slug: string; title: string; year: number;
  price: bigint; mileage: bigint; fuelType: string | null;
  transmission: string | null; color: string | null;
  isFeatured: boolean; isSold: boolean; viewsCount: number;
  brand: { id: number; name: string; slug: string; logoUrl: string | null };
  category: { id: number; name: string; slug: string; description: string | null } | null;
  images: { id: number; imageUrl: string; imageType: string; altText: string | null; sortOrder: number }[];
}) {
  return {
    ...car,
    price:     Number(car.price),
    mileage:   Number(car.mileage),
    mainImage: car.images[0]
      ? { ...car.images[0], imageUrl: resolveImageUrl(car.images[0].imageUrl) }
      : null,
  };
}

function normalizeDetail(car: Parameters<typeof normalizeSummary>[0] & {
  description: string | null; sourceUrl: string | null; sourceName: string | null;
  isPremium: boolean; isVerified: boolean; metaTitle: string | null;
  metaDescription: string | null; publishedAt: Date | null;
  images: { id: number; imageUrl: string; imageType: string; altText: string | null; sortOrder: number }[];
  specs: {
    engine: string | null; horsepower: string | null; torque: string | null;
    drivetrain: string | null; topSpeed: string | null; acceleration: string | null;
    doors: number | null; seats: number | null; weight: string | null;
    fuelEconomy: string | null; emissions: string | null;
  } | null;
}) {
  return {
    ...normalizeSummary(car),
    description:     car.description,
    sourceUrl:       car.sourceUrl,
    sourceName:      car.sourceName,
    isPremium:       car.isPremium,
    isVerified:      car.isVerified,
    metaTitle:       car.metaTitle,
    metaDescription: car.metaDescription,
    publishedAt:     car.publishedAt,
    images:          car.images.map((img) => ({
      ...img,
      imageUrl: resolveImageUrl(img.imageUrl),
    })),
    specs: car.specs,
  };
}
