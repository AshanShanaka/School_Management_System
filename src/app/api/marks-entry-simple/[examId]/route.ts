import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/marks-entry-simple/[examId] - Submit marks for students (simplified)
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
    const { subjectId, marks } = body;

    if (!subjectId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify the exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Process each mark submission using ExamResult model
    const results = [];
    for (const mark of marks) {
      const { studentId, score } = mark;

      if (!studentId || typeof score !== "number") {
        continue;
      }

      try {
        // Get the examSubjectId first
        const examSubject = await prisma.examSubject.findFirst({
          where: {
            examId,
            subjectId: parseInt(subjectId),
          },
        });

        if (!examSubject) {
          console.error("ExamSubject not found for:", { examId, subjectId });
          continue;
        }

        // Create exam result entry
        const result = await prisma.examResult.create({
          data: {
            examId,
            studentId,
            examSubjectId: examSubject.id,
            marks: score,
          },
        });
        results.push(result);
      } catch (createError) {
        // If entry already exists, update it
        try {
          const examSubject = await prisma.examSubject.findFirst({
            where: {
              examId,
              subjectId: parseInt(subjectId),
            },
          });

          if (examSubject) {
            await prisma.examResult.updateMany({
              where: {
                examId,
                studentId,
                examSubjectId: examSubject.id,
              },
              data: {
                marks: score,
              },
            });
            console.log("Updated existing result for student:", studentId);
          }
        } catch (updateError) {
          console.error("Error creating/updating result:", updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully submitted marks for ${results.length} students`,
      results: results.length,
    });
  } catch (error) {
    console.error("Error submitting marks:", error);
    return NextResponse.json(
      { error: "Failed to submit marks" },
      { status: 500 }
    );
  }
}
