import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/marks-entry/[examId]/[classId]/[subjectId] - Get students for marks entry
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string; classId: string; subjectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const classId = parseInt(params.classId);
    const subjectId = parseInt(params.subjectId);

    // Check if user has permission to enter marks for this subject
    if (user.role === "teacher") {
      const examSubject = await prisma.examSubject.findFirst({
        where: {
          examId,
          subjectId,
          teacherId: user.id,
        },
      });

      if (!examSubject) {
        return NextResponse.json(
          { error: "You don't have permission to enter marks for this subject" },
          { status: 403 }
        );
      }

      // Check if marks are already locked
      if (examSubject.marksEntered) {
        return NextResponse.json(
          { error: "Marks for this subject have already been entered and locked" },
          { status: 403 }
        );
      }
    }

    // Get students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        examResults: {
          where: {
            examId,
            examSubject: {
              subjectId,
            },
          },
        },
      },
      orderBy: [
        { name: "asc" },
        { surname: "asc" },
      ],
    });

    // Get exam subject details
    const examSubject = await prisma.examSubject.findFirst({
      where: {
        examId,
        subjectId,
      },
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
    });

    return NextResponse.json({
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        surname: student.surname,
        username: student.username,
        currentMarks: student.examResults[0]?.marks || null,
      })),
      examSubject,
    });

  } catch (error) {
    console.error("Error fetching marks entry data:", error);
    return NextResponse.json(
      { error: "Failed to fetch marks entry data" },
      { status: 500 }
    );
  }
}

// POST /api/marks-entry/[examId]/[classId]/[subjectId] - Submit marks
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string; classId: string; subjectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const classId = parseInt(params.classId);
    const subjectId = parseInt(params.subjectId);

    const body = await request.json();
    const { marks } = body;

    // Check if user has permission
    if (user.role === "teacher") {
      const examSubject = await prisma.examSubject.findFirst({
        where: {
          examId,
          subjectId,
          teacherId: user.id,
        },
      });

      if (!examSubject) {
        return NextResponse.json(
          { error: "You don't have permission to enter marks for this subject" },
          { status: 403 }
        );
      }

      if (examSubject.marksEntered) {
        return NextResponse.json(
          { error: "Marks for this subject have already been entered and locked" },
          { status: 403 }
        );
      }
    }

    // Validate marks data
    if (!Array.isArray(marks)) {
      return NextResponse.json(
        { error: "Invalid marks data format" },
        { status: 400 }
      );
    }

    // Get exam subject details
    const examSubject = await prisma.examSubject.findFirst({
      where: { examId, subjectId },
    });

    if (!examSubject) {
      return NextResponse.json(
        { error: "Exam subject not found" },
        { status: 404 }
      );
    }

    // Calculate grades for each mark
    const calculateGrade = (marks: number, maxMarks: number): string => {
      const percentage = (marks / maxMarks) * 100;
      if (percentage >= 75) return "A";
      if (percentage >= 65) return "B";
      if (percentage >= 50) return "C";
      if (percentage >= 35) return "S";
      return "F";
    };

    // Save marks
    await prisma.$transaction(async (tx) => {
      // Delete existing results
      await tx.examResult.deleteMany({
        where: {
          examId,
          examSubjectId: examSubject.id,
        },
      });

      // Insert new results
      for (const markEntry of marks) {
        const { studentId, marks: studentMarks } = markEntry;
        
        if (studentMarks >= 0 && studentMarks <= examSubject.maxMarks) {
          const grade = calculateGrade(studentMarks, examSubject.maxMarks);
          
          await tx.examResult.create({
            data: {
              examId,
              examSubjectId: examSubject.id,
              studentId,
              marks: studentMarks,
              grade,
            },
          });
        }
      }

      // Lock the subject marks
      await tx.examSubject.update({
        where: { id: examSubject.id },
        data: {
          marksEntered: true,
          marksEnteredAt: new Date(),
          marksEnteredBy: user.id,
        },
      });

      // Check if all subjects for this class are complete
      const allSubjects = await tx.examSubject.findMany({
        where: { examId },
      });

      const completedSubjects = allSubjects.filter(subject => subject.marksEntered);
      
      if (completedSubjects.length === allSubjects.length) {
        // All marks entered, update workflow stage
        await tx.reportWorkflow.upsert({
          where: {
            examId_classId: {
              examId,
              classId,
            },
          },
          create: {
            examId,
            classId,
            currentStage: "CLASS_REVIEW",
            marksComplete: true,
          },
          update: {
            currentStage: "CLASS_REVIEW",
            marksComplete: true,
          },
        });
      }
    });

    return NextResponse.json({ 
      message: "Marks submitted successfully",
      marksLocked: true,
    });

  } catch (error) {
    console.error("Error submitting marks:", error);
    return NextResponse.json(
      { error: "Failed to submit marks" },
      { status: 500 }
    );
  }
}
