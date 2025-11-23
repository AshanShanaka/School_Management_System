import { NextRequest, NextResponse } from "next/server";
import { getNextIndexNumber, bulkGenerateIndexNumbers } from "@/lib/utils/indexNumberGenerator";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/students/index-number/next
 * Get the next available index number
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix") || "";

    const nextIndexNumber = await getNextIndexNumber(prefix);

    return NextResponse.json({
      success: true,
      indexNumber: nextIndexNumber,
    });
  } catch (error) {
    console.error("Error generating index number:", error);
    return NextResponse.json(
      { error: "Failed to generate index number" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students/index-number/bulk-generate
 * Bulk generate index numbers for all students without one
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const prefix = body.prefix || "";

    const count = await bulkGenerateIndexNumbers(prefix);

    return NextResponse.json({
      success: true,
      count,
      message: `Successfully generated ${count} index numbers`,
    });
  } catch (error) {
    console.error("Error bulk generating index numbers:", error);
    return NextResponse.json(
      { error: "Failed to bulk generate index numbers" },
      { status: 500 }
    );
  }
}
