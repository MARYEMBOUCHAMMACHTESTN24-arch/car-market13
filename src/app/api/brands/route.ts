/**
 * GET /api/brands
 * Returns all brands with active car counts.
 */
import { NextResponse } from "next/server";
import { getAllBrands } from "../../../services/brand.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await getAllBrands();
    return NextResponse.json(
      { data: brands, count: brands.length },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/brands]", err);
    return NextResponse.json(
      { error: true, message: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
