import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string; studentId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const studentId = params.studentId;

    // Verify the student belongs to this parent
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: {
        students: {
          where: { id: studentId },
          select: { id: true },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return NextResponse.json(
        { error: "You don't have access to this student's report card" },
        { status: 403 }
      );
    }

    // Get the report card
    const reportCard = await prisma.reportCard.findFirst({
      where: {
        examId: examId,
        studentId: studentId,
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

    if (!reportCard) {
      return NextResponse.json(
        { error: "Report card not found or not yet published" },
        { status: 404 }
      );
    }

    // Get exam results for subject breakdown
    const examResults = await prisma.examResult.findMany({
      where: {
        examId: examId,
        studentId: studentId,
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
        studentId: studentId,
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

    return NextResponse.json(
      {
        reportCard,
        subjects,
        examSummary,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PARENT REPORT CARD DETAIL] Error:", error);
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
