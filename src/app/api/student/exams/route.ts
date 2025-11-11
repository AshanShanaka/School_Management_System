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

    if (user.role !== "student") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all exams for the student's grade
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      include: {
        grade: {
          select: {
            id: true,
            level: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const exams = await prisma.exam.findMany({
      where: {
        gradeId: student.gradeId,
      },
      include: {
        grade: {
          select: {
            id: true,
            level: true,
          },
        },
        results: {
          where: {
            studentId: student.id,
          },
          select: {
            id: true,
            score: true,
            grade: true,
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { term: "desc" },
        { examDate: "desc" },
      ],
    });

    // Map exams with status
    const examsWithStatus = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      year: exam.year,
      term: exam.term,
      examDate: exam.examDate,
      status: exam.results.length > 0 ? "completed" : "pending",
      grade: exam.grade,
    }));

    return NextResponse.json({ exams: examsWithStatus });

  } catch (error) {
    console.error("Error fetching student exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}
