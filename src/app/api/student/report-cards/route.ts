import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all report cards for the student
    const reportCards = await prisma.reportCard.findMany({
      where: {
        studentId: user.id,
        status: "PUBLISHED", // Only show published report cards
      },
      include: {
        exam: {
          include: {
            grade: true,
            examType: true,
          },
        },
        class: {
          include: {
            grade: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: [
        { exam: { year: "desc" } },
        { exam: { term: "desc" } },
        { generatedAt: "desc" },
      ],
    });

    // Get exam summaries for additional details
    const examSummaries = await prisma.examSummary.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        exam: {
          include: {
            grade: true,
            examType: true,
          },
        },
      },
      orderBy: [
        { exam: { year: "desc" } },
        { exam: { term: "desc" } },
      ],
    });

    return NextResponse.json(
      {
        reportCards,
        examSummaries,
        count: reportCards.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching student report cards:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch report cards",
      },
      { status: 500 }
    );
  }
}
