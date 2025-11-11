import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/grade-bands - Get all grade bands
export async function GET(request: NextRequest) {
  try {
    const gradeBands = await prisma.gradeBand.findMany({
      orderBy: {
        minPercent: "desc"
      }
    });

    return NextResponse.json(gradeBands);
  } catch (error) {
    console.error("Error fetching grade bands:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade bands" },
      { status: 500 }
    );
  }
}
