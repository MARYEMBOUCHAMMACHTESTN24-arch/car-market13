/**
 * GET /api/cars
 * Paginated, filterable car listing from v2_cars.
 *
 * Query params (all optional):
 *   brand, category, fuelType, transmission, drivetrain, color
 *   minPrice, maxPrice, minYear, maxYear, maxMileage
 *   minHp, maxHp, seats, isFeatured, status
 *   q (search), page, limit, sortBy, sortDir
 */
import { NextRequest, NextResponse } from "next/server";
import { getCars } from "../../../services/car.service";
import { CarFilterSchema } from "../../../lib/schemas";
import { ZodError } from "zod";

export const dynamic = "force-dynamic"; // Never cache — always fresh

export async function GET(req: NextRequest) {
  try {
    // Parse + validate all query params via Zod
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = CarFilterSchema.parse(rawParams);

    const result = await getCars(filters);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: true, message: "Invalid query parameters", code: "VALIDATION_ERROR", details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("[GET /api/cars]", err);
    return NextResponse.json(
      { error: true, message: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
