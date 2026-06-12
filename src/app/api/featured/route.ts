/**
 * GET /api/featured
 * Returns featured cars. Cached aggressively at the edge.
 * Query: ?limit=8 (default)
 */
import { NextRequest, NextResponse } from "next/server";
import { getFeaturedCars } from "../../../services/car.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam ?? "8", 10), 24);

    const cars = await getFeaturedCars(isNaN(limit) ? 8 : limit);

    return NextResponse.json(
      { data: cars, count: cars.length },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/featured]", err);
    return NextResponse.json(
      { error: true, message: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
