import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/marks-entry-new/[examId] - Submit marks for students (New Enhanced Version)
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const { subjectId, classId, results, isDraft } = await request.json();

    if (!subjectId || !classId || !Array.isArray(results)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher has permission to enter marks
    const assignment = await prisma.subjectAssignment.findFirst({
      where: {
        teacherId: user.id,
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "No permission to enter marks for this subject/class" }, { status: 403 });
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        status: true,
        marksEntryDeadline: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check if marks entry is allowed
    if (!["MARKS_ENTRY", "CLASS_REVIEW"].includes(exam.status)) {
      return NextResponse.json({ error: "Marks entry is not allowed for this exam" }, { status: 400 });
    }

    // Check deadline if exists
    if (exam.marksEntryDeadline && new Date() > new Date(exam.marksEntryDeadline)) {
      return NextResponse.json({ error: "Marks entry deadline has passed" }, { status: 400 });
    }

    // Get or create exam subject
    let examSubject = await prisma.examSubject.findFirst({
      where: {
        examId: examId,
        subjectId: parseInt(subjectId),
      },
    });

    if (!examSubject) {
      examSubject = await prisma.examSubject.create({
        data: {
          examId: examId,
          subjectId: parseInt(subjectId),
          maxMarks: 100, // Default max marks
        },
      });
    }

    // Process results in a transaction
    const savedResults = await prisma.$transaction(async (tx) => {
      const resultPromises = results.map(async (result: any) => {
        const { studentId, marks, grade } = result;

        if (!studentId) {
          throw new Error("Student ID is required");
        }

        // Verify student is in the correct class
        const student = await tx.student.findFirst({
          where: {
            id: studentId,
            classId: parseInt(classId),
          },
        });

        if (!student) {
          throw new Error(`Student ${studentId} not found in class`);
        }

        // Create or update exam result
        return tx.examResult.upsert({
          where: {
            examId_subjectId_studentId: {
              examId: examId,
              subjectId: parseInt(subjectId),
              studentId: studentId,
            },
          },
          update: {
            marks: marks,
            grade: grade,
            updatedAt: new Date(),
          },
          create: {
            examId: examId,
            subjectId: parseInt(subjectId),
            studentId: studentId,
            marks: marks,
            grade: grade,
            createdAt: new Date(),
          },
        });
      });

      const savedResults = await Promise.all(resultPromises);

      // Update exam subject status if not draft
      if (!isDraft) {
        await tx.examSubject.update({
          where: {
            id: examSubject.id,
          },
          data: {
            marksEntered: true,
            marksEnteredAt: new Date(),
            marksEnteredBy: user.id,
          },
        });
      }

      return savedResults;
    });

    return NextResponse.json({
      message: isDraft ? "Marks saved as draft" : "Marks submitted successfully",
      results: savedResults,
    });

  } catch (error) {
    console.error("Error saving marks:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save marks" },
      { status: 500 }
    );
  }
}
