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

    // Get subjects assigned to this teacher through SubjectAssignment
    const subjectAssignments = await prisma.subjectAssignment.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            gradeId: true,
            grade: {
              select: {
                id: true,
                level: true,
              },
            },
          },
        },
      },
    });

    // Get all active exams for the grades this teacher teaches
    const gradeIds = Array.from(new Set(subjectAssignments.map(sa => sa.class.gradeId)));
    
    const exams = await prisma.exam.findMany({
      where: {
        gradeId: {
          in: gradeIds,
        },
        status: {
          in: ["PUBLISHED", "MARKS_ENTRY"],
        },
      },
      include: {
        grade: {
          select: {
            id: true,
            level: true,
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { term: "desc" },
        { title: "asc" },
      ],
    });

    // Create exam-subject combinations for each exam that includes subjects this teacher teaches
    const examSubjects = [];
    
    for (const exam of exams) {
      // Find subjects this teacher teaches for this exam's grade
      const teacherSubjectsForGrade = subjectAssignments.filter(
        sa => sa.class.gradeId === exam.gradeId
      );

      for (const assignment of teacherSubjectsForGrade) {
        // Check if there's an existing ExamSubject record for this exam and subject
        const existingExamSubject = await prisma.examSubject.findFirst({
          where: {
            examId: exam.id,
            subjectId: assignment.subject.id,
          },
          select: {
            id: true,
            marksEntered: true,
            marksEnteredAt: true,
          },
        });

        examSubjects.push({
          id: existingExamSubject?.id || `${exam.id}_${assignment.subject.id}`,
          marksEntered: existingExamSubject?.marksEntered || false,
          marksEnteredAt: existingExamSubject?.marksEnteredAt || null,
          exam: {
            id: exam.id,
            title: exam.title,
            year: exam.year,
            term: exam.term,
            status: exam.status,
            grade: exam.grade,
          },
          subject: assignment.subject,
        });
      }
    }

    return NextResponse.json({ examSubjects });

  } catch (error) {
    console.error("Error fetching assigned exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned exams" },
      { status: 500 }
    );
  }
}
