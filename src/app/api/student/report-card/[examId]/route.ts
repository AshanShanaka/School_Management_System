import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 30) return "D";
  return "F";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const { examId } = params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get student information
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

    // Get exam information
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: {
          select: {
            level: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check if exam is for student's grade
    if (exam.gradeId !== student.gradeId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get student's results for this exam
    const results = await prisma.result.findMany({
      where: {
        examId: examId,
        studentId: student.id,
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (results.length === 0) {
      return NextResponse.json({ error: "Results not available yet" }, { status: 404 });
    }

    // Calculate totals and grades
    const totalMarks = results.reduce((sum, result) => sum + 100, 0); // Assuming each subject is out of 100
    const totalObtained = results.reduce((sum, result) => sum + result.score, 0);
    const percentage = (totalObtained / totalMarks) * 100;
    const overallGrade = calculateGrade(percentage);

    // Get class statistics for ranking
    const allClassResults = await prisma.result.findMany({
      where: {
        examId: examId,
        student: {
          gradeId: student.gradeId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    // Group results by student and calculate their totals
    const studentTotals = allClassResults.reduce((acc, result) => {
      if (!acc[result.studentId]) {
        acc[result.studentId] = 0;
      }
      acc[result.studentId] += result.score;
      return acc;
    }, {} as Record<string, number>);

    const sortedTotals = Object.entries(studentTotals)
      .map(([studentId, total]) => ({ studentId, total: Number(total) }))
      .sort((a, b) => b.total - a.total);

    const classRank = sortedTotals.findIndex(s => s.studentId === student.id) + 1;
    const totalStudents = sortedTotals.length;
    const classAverage = sortedTotals.reduce((sum, s) => sum + Number(s.total), 0) / totalStudents;
    const classAveragePercentage = (classAverage / totalMarks) * 100;

    // Format results
    const formattedResults = results.map((result) => ({
      subject: result.subject,
      score: result.score,
      grade: calculateGrade((result.score / 100) * 100),
    }));

    const reportData = {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        grade: student.grade,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        year: exam.year,
        term: exam.term,
        examDate: exam.examDate,
      },
      results: formattedResults,
      totalMarks,
      totalObtained,
      percentage,
      overallGrade,
      classRank,
      totalStudents,
      classAverage: classAveragePercentage,
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error("Error fetching student report card:", error);
    return NextResponse.json(
      { error: "Failed to fetch report card" },
      { status: 500 }
    );
  }
}
