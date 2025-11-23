import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    console.log("[STUDENT REPORT CARD DETAIL] Starting request for examId:", params.examId);
    const user = await getCurrentUser();

    if (!user || user.role !== "student") {
      console.log("[STUDENT REPORT CARD DETAIL] Unauthorized - User:", user?.role);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[STUDENT REPORT CARD DETAIL] User ID:", user.id);
    const examId = parseInt(params.examId);

    // Get the report card
    const reportCard = await prisma.reportCard.findFirst({
      where: {
        examId: examId,
        studentId: user.id,
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
            email: true,
            img: true,
          },
        },
      },
    });

    console.log("[STUDENT REPORT CARD DETAIL] Report card found:", !!reportCard);

    if (!reportCard) {
      console.log("[STUDENT REPORT CARD DETAIL] No report card found for examId:", examId, "studentId:", user.id);
      return NextResponse.json(
        { error: "Report card not found or not yet published" },
        { status: 404 }
      );
    }

    // Get exam results for subject breakdown
    const examResults = await prisma.examResult.findMany({
      where: {
        examId: examId,
        studentId: user.id,
      },
      include: {
        examSubject: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Get exam summary
    const examSummary = await prisma.examSummary.findFirst({
      where: {
        examId: examId,
        studentId: user.id,
      },
    });

    // Format subject results - always calculate grade from percentage for accuracy
    const subjects = examResults.map((result) => {
      const percentage = (result.marks / result.examSubject.maxMarks) * 100;
      return {
        subjectId: result.examSubject.subjectId,
        subjectName: result.examSubject.subject.name,
        marks: result.marks,
        maxMarks: result.examSubject.maxMarks,
        percentage: percentage.toFixed(1),
        grade: calculateGrade(percentage), // Always calculate from percentage
      };
    });

    console.log("[STUDENT REPORT CARD DETAIL] Found", subjects.length, "subjects");

    return NextResponse.json(
      {
        reportCard,
        subjects,
        examSummary,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[STUDENT REPORT CARD DETAIL] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch report card details",
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate grade
function calculateGrade(percentage: number): string {
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 35) return "S";
  return "F";
}
