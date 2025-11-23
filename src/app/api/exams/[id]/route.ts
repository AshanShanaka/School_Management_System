import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/exams/[id] - Get specific exam
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.id);
    
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
        examType: true,
        examSubjects: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            }
          }
        },
        results: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            }
          }
        },
        examSummaries: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            }
          },
          orderBy: {
            classRank: "asc"
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // For non-admin users, only show published exams
    if (user.role !== "admin" && exam.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get total students count for this grade
    const totalStudents = await prisma.student.count({
      where: {
        gradeId: exam.gradeId
      }
    });

    return NextResponse.json({
      ...exam,
      totalStudents
    });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[id] - Update exam (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.id);
    const body = await request.json();
    const { title, year, term, examTypeEnum, status } = body;

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        ...(title && { title }),
        ...(year && { year: parseInt(year) }),
        ...(term && { term: parseInt(term) }),
        ...(examTypeEnum && { examTypeEnum }),
        ...(status && { status }),
        ...(status === "PUBLISHED" && { publishedAt: new Date() })
      },
      include: {
        grade: true,
        examType: true,
        examSubjects: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] - Delete exam (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.id);

    // Check if exam has results
    const examWithResults = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        results: true
      }
    });

    if (!examWithResults) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (examWithResults.results.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete exam with existing results" },
        { status: 400 }
      );
    }

    await prisma.exam.delete({
      where: { id: examId }
    });

    return NextResponse.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
