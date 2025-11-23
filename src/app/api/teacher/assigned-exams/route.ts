import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher with their assigned subjects (many-to-many relation)
    const teacher = await prisma.teacher.findUnique({
      where: {
        id: user.id,
      },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!teacher || teacher.subjects.length === 0) {
      return NextResponse.json({ 
        examSubjects: [],
        message: "No subjects assigned to this teacher" 
      });
    }

    // Get subject IDs this teacher teaches
    const subjectIds = teacher.subjects.map(s => s.id);

    // Get all exam subjects for these subjects where exams are published or in marks entry
    // ONLY show Grade 11 exams (current year) - Grade 9 & 10 are historical
    const examSubjects = await prisma.examSubject.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        exam: {
          status: {
            in: ["PUBLISHED", "MARKS_ENTRY", "CLASS_REVIEW"],
          },
          grade: {
            level: 11, // Only Grade 11 (current year exams)
          },
        },
      },
      include: {
        exam: {
          include: {
            grade: {
              select: {
                id: true,
                level: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { exam: { year: "desc" } },
        { exam: { term: "desc" } },
        { exam: { title: "asc" } },
      ],
    });

    // Format the response
    const formattedExamSubjects = examSubjects.map(es => ({
      id: es.id,
      marksEntered: es.marksEntered || false,
      marksEnteredAt: es.marksEnteredAt || null,
      exam: {
        id: es.exam.id,
        title: es.exam.title,
        year: es.exam.year,
        term: es.exam.term,
        status: es.exam.status,
        grade: es.exam.grade,
      },
      subject: es.subject,
    }));

    return NextResponse.json({ examSubjects: formattedExamSubjects });

  } catch (error) {
    console.error("Error fetching assigned exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned exams", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
