import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/exam-workflow/[examId] - Get workflow status for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    // Get exam with basic information
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
        examSubjects: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get results to calculate progress (using ExamResult model)
    const results = await prisma.examResult.findMany({
      where: { examId },
      include: {
        student: true,
      },
    });

    // Calculate progress - count unique students with results  
    const totalSubjects = exam.examSubjects?.length || 0;
    const studentsWithResults = new Set(results.map(r => r.studentId)).size;
    
    // For now, just use the gradeId to get students
    const totalStudents = await prisma.student.count({
      where: { gradeId: exam.gradeId },
    });

    return NextResponse.json({
      exam,
      progress: {
        totalSubjects,
        studentsWithResults,
        totalStudents,
        percentage: totalStudents > 0 ? (studentsWithResults / totalStudents) * 100 : 0,
      },
      results: results.length,
    });
  } catch (error) {
    console.error("Error fetching exam workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam workflow" },
      { status: 500 }
    );
  }
}

// POST /api/exam-workflow/[examId] - Update workflow status
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    // Validate permissions
    if (action === "start_marks_entry" && user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can start marks entry" }, { status: 403 });
    }

    if (action === "publish_results" && user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can publish results" }, { status: 403 });
    }

    let updatedExam;

    switch (action) {
      case "start_marks_entry":
        // Update exam status (using existing PUBLISHED status for now)
        updatedExam = await prisma.exam.update({
          where: { id: examId },
          data: { status: "PUBLISHED" },
        });
        break;

      case "publish_results":
        // Publish results
        updatedExam = await prisma.exam.update({
          where: { id: examId },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.error("Error updating exam workflow:", error);
    return NextResponse.json(
      { error: "Failed to update exam workflow" },
      { status: 500 }
    );
  }
}
