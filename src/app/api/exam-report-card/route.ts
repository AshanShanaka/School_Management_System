import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateClassReportCards, getStudentReportCard } from "@/lib/examService";

/**
 * GET /api/exam-report-card?examId=X&studentId=Y
 * Get report card for a specific student
 * 
 * OR
 * 
 * GET /api/exam-report-card?examId=X&classId=Y&generate=true
 * Generate report cards for entire class (Class Teacher only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const generate = searchParams.get("generate") === "true";

    if (!examId) {
      return NextResponse.json(
        { error: "Missing required parameter: examId" },
        { status: 400 }
      );
    }

    // Generate report cards for entire class (Class Teacher only)
    if (generate && classId) {
      if (user.role !== "teacher") {
        return NextResponse.json(
          { error: "Unauthorized. Teacher access required." },
          { status: 403 }
        );
      }

      const reportCards = await generateClassReportCards(
        parseInt(examId),
        parseInt(classId)
      );

      return NextResponse.json({
        success: true,
        message: `Generated report cards for ${reportCards.length} students`,
        reportCards,
      });
    }

    // Get single student report card
    if (studentId) {
      // Authorization check
      if (user.role === "student" && user.id !== studentId) {
        return NextResponse.json(
          { error: "Unauthorized. You can only view your own report card." },
          { status: 403 }
        );
      }

      if (user.role === "parent") {
        // Verify the student is the parent's child
        const { default: prisma } = await import("@/lib/prisma");
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });

        if (!student || student.parentId !== user.id) {
          return NextResponse.json(
            { error: "Unauthorized. You can only view your children's report cards." },
            { status: 403 }
          );
        }
      }

      const reportCard = await getStudentReportCard(
        parseInt(examId),
        studentId
      );

      return NextResponse.json({
        success: true,
        reportCard,
      });
    }

    return NextResponse.json(
      { error: "Either studentId or (classId + generate=true) is required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error fetching/generating report card:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch/generate report card" },
      { status: 500 }
    );
  }
}
