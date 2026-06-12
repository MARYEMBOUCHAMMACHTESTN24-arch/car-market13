/**
 * category.service.ts
 * Prisma queries for the v2_categories table.
 */
import prisma from "../lib/prisma";

export async function getAllCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id:          true,
      name:        true,
      slug:        true,
      description: true,
      _count:      { select: { cars: { where: { status: "active" } } } },
    },
  });

  return categories.map((c) => ({
    id:          c.id,
    name:        c.name,
    slug:        c.slug,
    description: c.description,
    carCount:    c._count.cars,
  }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where:  { slug },
    select: { id: true, name: true, slug: true, description: true },
  });
}
