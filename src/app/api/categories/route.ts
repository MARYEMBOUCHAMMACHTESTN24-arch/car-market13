/**
 * GET /api/categories
 * Returns all categories with active car counts.
 * Also includes available filter options (price range, fuel types, etc.)
 */
import { NextResponse } from "next/server";
import { getAllCategories } from "../../../services/category.service";
import { getFilterOptions } from "../../../services/car.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categories, filterOptions] = await Promise.all([
      getAllCategories(),
      getFilterOptions(),
    ]);

    return NextResponse.json(
      { data: categories, count: categories.length, filterOptions },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json(
      { error: true, message: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
