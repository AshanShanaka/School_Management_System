import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = params.id;

    // Get student's exam results across all exams
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        exam: {
          select: {
            title: true,
            term: true,
            year: true,
          },
        },
        examSubject: {
          include: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        exam: {
          year: "asc",
        },
      },
    });

    // Calculate average marks per exam
    const examAverages: { [key: string]: number[] } = {};

    examResults.forEach((result) => {
      const examKey = `${result.exam.year}-Term${result.exam.term}`;
      if (!examAverages[examKey]) {
        examAverages[examKey] = [];
      }
      examAverages[examKey].push(result.marks);
    });

    // Get average mark for each exam period
    const marks = Object.keys(examAverages)
      .sort()
      .map((key) => {
        const examMarks = examAverages[key];
        return examMarks.reduce((sum, mark) => sum + mark, 0) / examMarks.length;
      });

    // Also get subject-specific marks for more detailed prediction
    const subjectMarks: { [key: string]: number[] } = {};

    examResults.forEach((result) => {
      const subjectName = result.examSubject.subject.name;
      if (!subjectMarks[subjectName]) {
        subjectMarks[subjectName] = [];
      }
      subjectMarks[subjectName].push(result.marks);
    });

    return NextResponse.json({
      success: true,
      marks: marks, // Overall exam averages
      subjectMarks: subjectMarks, // Subject-specific marks
      totalExams: Object.keys(examAverages).length,
      examDetails: examResults.map((r) => ({
        exam: `${r.exam.title}`,
        subject: r.examSubject.subject.name,
        marks: r.marks,
        grade: r.grade,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching exam history:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam history" },
      { status: 500 }
    );
  }
}
