import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/exam-types - Get all exam types
export async function GET(request: NextRequest) {
  try {
    const examTypes = await prisma.examType.findMany({
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(examTypes);
  } catch (error) {
    console.error("Error fetching exam types:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam types" },
      { status: 500 }
    );
  }
}
