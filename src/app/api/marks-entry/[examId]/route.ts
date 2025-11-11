import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/marks-entry/[examId] - Get marks entry interface for teachers
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

    // Get exam information
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // For teachers, get subjects from exam timetable (ExamSubject)
    let teacherSubjects: any[] = [];
    if (user.role === "teacher") {
      // Get subjects from Teacher → Subject relation (many-to-many)
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        include: {
          subjects: true, // Subjects this teacher teaches
        },
      });

      if (!teacher || teacher.subjects.length === 0) {
        return NextResponse.json(
          { error: "You are not assigned to teach any subjects. Please contact admin." },
          { status: 403 }
        );
      }

      teacherSubjects = teacher.subjects;
    }

    // Get exam subjects (create if not exist for teacher's subjects)
    let examSubjects;
    if (user.role === "teacher") {
      // Get or create exam subjects for teacher's assigned subjects
      examSubjects = [];
      for (const subject of teacherSubjects) {
        let examSubject = await prisma.examSubject.findFirst({
          where: {
            examId,
            subjectId: subject.id,
          },
          include: {
            subject: true,
            subjectResults: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    username: true,
                  },
                },
              },
            },
          },
        });

        // Create if doesn't exist
        if (!examSubject) {
          examSubject = await prisma.examSubject.create({
            data: {
              examId,
              subjectId: subject.id,
              teacherId: null, // No specific teacher assignment
              maxMarks: 100,
            },
            include: {
              subject: true,
              subjectResults: {
                include: {
                  student: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                      username: true,
                    },
                  },
                },
              },
            },
          });
        }

        examSubjects.push(examSubject);
      }
    } else {
      // Admin sees all exam subjects
      examSubjects = await prisma.examSubject.findMany({
        where: { examId },
        include: {
          subject: true,
          subjectResults: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  username: true,
                },
              },
            },
          },
        },
      });
    }

    // Get students for this exam's grade
    const students = await prisma.student.findMany({
      where: {
        gradeId: exam.gradeId,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        classId: true,
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    });

    const enrichedExam = {
      ...exam,
      examSubjects,
    };

    return NextResponse.json({ exam: enrichedExam, students });
  } catch (error) {
    console.error("Error fetching marks entry data:", error);
    return NextResponse.json(
      { error: "Failed to fetch marks entry data" },
      { status: 500 }
    );
  }
}

// POST /api/marks-entry/[examId] - Submit marks for a subject
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json({ error: "Only teachers and admins can enter marks" }, { status: 403 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const body = await request.json();
    const { subjectId, marks } = body;

    if (!subjectId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: "Subject ID and marks array are required" },
        { status: 400 }
      );
    }

    // Verify teacher is assigned to this subject (unless admin)
    if (user.role === "teacher") {
      // Check if teacher teaches this subject through Teacher → Subject relation
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        include: {
          subjects: {
            where: {
              id: parseInt(subjectId),
            },
          },
        },
      });

      if (!teacher || teacher.subjects.length === 0) {
        return NextResponse.json(
          { error: "You are not assigned to teach this subject. Please contact admin." },
          { status: 403 }
        );
      }
    }

    // Start transaction to update/create marks
    const results = await prisma.$transaction(async (tx) => {
      const resultPromises = marks.map(async (mark: any) => {
        const { studentId, marksObtained } = mark;

        if (!studentId) {
          throw new Error("Student ID is required for each mark entry");
        }

        const examSubjectId = await getExamSubjectId(tx, examId, parseInt(subjectId));

        // Upsert exam result
        return tx.examResult.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId,
              studentId,
            },
          },
          update: {
            marks: marksObtained !== null && marksObtained !== undefined ? parseInt(marksObtained) : 0,
            grade: null, // Will be calculated later
            updatedAt: new Date(),
          },
          create: {
            studentId,
            examSubjectId,
            examId,
            marks: marksObtained !== null && marksObtained !== undefined ? parseInt(marksObtained) : 0,
            grade: null,
          },
        });
      });

      const results = await Promise.all(resultPromises);

      // Mark subject as completed
      await tx.examSubject.updateMany({
        where: {
          examId,
          subjectId: parseInt(subjectId),
        },
        data: {
          marksEntered: true,
          marksEnteredAt: new Date(),
          marksEnteredBy: user.id,
        },
      });

      return results;
    });

    // Check if all subjects are completed for this exam
    const allExamSubjects = await prisma.examSubject.findMany({
      where: { examId },
    });

    const allCompleted = allExamSubjects.every((sub) => sub.marksEntered);

    if (allCompleted) {
      await prisma.exam.update({
        where: { id: examId },
        data: { status: "CLASS_REVIEW" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Marks submitted successfully",
      resultsCount: results.length,
      allSubjectsCompleted: allCompleted,
    });
  } catch (error) {
    console.error("Error submitting marks:", error);
    return NextResponse.json(
      { error: "Failed to submit marks" },
      { status: 500 }
    );
  }
}

// Helper function to get examSubjectId
async function getExamSubjectId(tx: any, examId: number, subjectId: number) {
  const examSubject = await tx.examSubject.findFirst({
    where: { examId, subjectId },
    select: { id: true },
  });

  if (!examSubject) {
    throw new Error("Exam subject not found");
  }

  return examSubject.id;
}
