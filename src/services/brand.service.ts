/**
 * brand.service.ts
 * Prisma queries for the v2_brands table.
 */
import prisma from "../lib/prisma";

export async function getAllBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id:      true,
      name:    true,
      slug:    true,
      logoUrl: true,
      _count:  { select: { cars: { where: { status: "active" } } } },
    },
  });

  return brands.map((b) => ({
    id:       b.id,
    name:     b.name,
    slug:     b.slug,
    logoUrl:  b.logoUrl,
    carCount: b._count.cars,
  }));
}

export async function getBrandBySlug(slug: string) {
  return prisma.brand.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
}
