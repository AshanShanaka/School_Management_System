import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get parent's children
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
          },
        },
      },
    });

    if (!parent || !parent.students.length) {
      return NextResponse.json(
        { error: "No children found" },
        { status: 404 }
      );
    }

    // Get all report cards for all children
    const reportCards = await prisma.reportCard.findMany({
      where: {
        studentId: {
          in: parent.students.map((s) => s.id),
        },
        status: "PUBLISHED",
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
            username: true,
          },
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    return NextResponse.json(
      {
        reportCards,
        children: parent.students,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PARENT REPORT CARDS] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch report cards",
      },
      { status: 500 }
    );
  }
}
