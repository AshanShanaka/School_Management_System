import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("classId");
    const examId = searchParams.get("examId");

    if (!classId || !examId) {
      return NextResponse.json({ error: "Missing classId or examId" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(examId) },
      include: {
        examSubjects: {
          include: {
            subject: true,
          },
          orderBy: {
            subject: {
              name: "asc",
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { classId: parseInt(classId) },
      include: {
        examResults: {
          where: { examId: parseInt(examId) },
          include: {
            examSubject: {
              include: {
                subject: true,
              },
            },
          },
        },
        examSummaries: {
          where: { examId: parseInt(examId) },
        },
      },
      orderBy: [
        { surname: "asc" },
        { name: "asc" },
      ],
    });

    // Calculate summaries if not present
    const studentsWithSummaries = students.map((student) => {
      let summary = student.examSummaries[0];
      
      // If no summary exists, calculate it
      if (!summary && student.examResults.length > 0) {
        const totalMarks = student.examResults.reduce((sum, result) => sum + result.marks, 0);
        const average = totalMarks / student.examResults.length;
        
        // Calculate overall grade
        let overallGrade = "W";
        if (average >= 75) overallGrade = "A";
        else if (average >= 65) overallGrade = "B";
        else if (average >= 50) overallGrade = "C";
        else if (average >= 35) overallGrade = "S";
        
        summary = {
          id: 0,
          examId: parseInt(examId),
          studentId: student.id,
          totalMarks,
          average,
          overallGrade,
          classRank: 0,
          gradeRank: 0,
          createdAt: new Date(),
        };
      }
      
      return {
        ...student,
        examSummaries: summary ? [summary] : [],
      };
    });

    // Calculate ranks and sort by rank
    const sortedByAverage = [...studentsWithSummaries]
      .filter((s) => s.examSummaries.length > 0)
      .sort((a, b) => (b.examSummaries[0]?.average || 0) - (a.examSummaries[0]?.average || 0));

    sortedByAverage.forEach((student, index) => {
      if (student.examSummaries[0]) {
        student.examSummaries[0].classRank = index + 1;
      }
    });

    // Students without results at the end
    const studentsWithoutResults = studentsWithSummaries.filter((s) => s.examSummaries.length === 0);

    return NextResponse.json({
      exam,
      students: [...sortedByAverage, ...studentsWithoutResults],
    });
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
