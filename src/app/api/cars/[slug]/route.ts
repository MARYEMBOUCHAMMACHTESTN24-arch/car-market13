/**
 * GET /api/cars/[slug]
 * Returns full car detail, images, specs, and related cars.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCarBySlug, getRelatedCars } from "../../../../services/car.service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: true, message: "Invalid slug parameter", code: "INVALID_PARAM" },
        { status: 400 }
      );
    }

    const car = await getCarBySlug(slug);

    if (!car) {
      return NextResponse.json(
        { error: true, message: "Car not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Fetch related cars in parallel
    const related = await getRelatedCars(car.id, car.brand.id, car.category?.id ?? null, 6);

    return NextResponse.json(
      { car, related },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/cars/[slug]]", err);
    return NextResponse.json(
      { error: true, message: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
