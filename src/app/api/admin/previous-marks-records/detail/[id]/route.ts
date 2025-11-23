import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const examId = parseInt(params.id);

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
        class: true,
        examType: true,
        examSubjects: {
          include: {
            subject: true,
            subjectResults: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Calculate subject-wise statistics
    const subjects = exam.examSubjects.map((examSubject) => {
      const results = examSubject.subjectResults;
      const marks = results.map(r => r.marks);
      const passCount = marks.filter(m => m >= 35).length;
      
      return {
        name: examSubject.subject.name,
        avgScore: marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0,
        passRate: results.length > 0 ? (passCount / results.length) * 100 : 0,
        highestScore: marks.length > 0 ? Math.max(...marks) : 0,
        lowestScore: marks.length > 0 ? Math.min(...marks) : 0,
        studentCount: results.length,
      };
    });

    // Get all unique students
    const studentIds = new Set(
      exam.examSubjects.flatMap(es => es.subjectResults.map(r => r.studentId))
    );

    // Calculate grade distribution
    const allMarks = exam.examSubjects.flatMap(es => es.subjectResults.map(r => r.marks));
    const gradeDistribution = {
      A: allMarks.filter(m => m >= 75).length,
      B: allMarks.filter(m => m >= 65 && m < 75).length,
      C: allMarks.filter(m => m >= 50 && m < 65).length,
      S: allMarks.filter(m => m >= 35 && m < 50).length,
      F: allMarks.filter(m => m < 35).length,
    };

    // Calculate overall statistics
    const totalMarks = allMarks.reduce((a, b) => a + b, 0);
    const passMarks = allMarks.filter(m => m >= 35).length;
    
    const overallStats = {
      totalStudents: studentIds.size,
      averageScore: allMarks.length > 0 ? totalMarks / allMarks.length : 0,
      passRate: allMarks.length > 0 ? (passMarks / allMarks.length) * 100 : 0,
      highestScore: allMarks.length > 0 ? Math.max(...allMarks) : 0,
      lowestScore: allMarks.length > 0 ? Math.min(...allMarks) : 0,
    };

    // Calculate top performers (by total marks across all subjects)
    const studentTotals = new Map<number, { name: string; total: number; count: number }>();
    
    exam.examSubjects.forEach(examSubject => {
      examSubject.subjectResults.forEach(result => {
        const existing = studentTotals.get(result.studentId);
        if (existing) {
          existing.total += result.marks;
          existing.count += 1;
        } else {
          studentTotals.set(result.studentId, {
            name: `${result.student.name} ${result.student.surname}`,
            total: result.marks,
            count: 1,
          });
        }
      });
    });

    const topPerformers = Array.from(studentTotals.values())
      .map(student => ({
        studentName: student.name,
        totalScore: student.total,
        average: student.count > 0 ? student.total / student.count : 0,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    const responseData = {
      id: exam.id,
      title: exam.title,
      year: exam.year,
      term: exam.term,
      grade: {
        id: exam.grade.id,
        level: exam.grade.level,
      },
      class: exam.class ? {
        id: exam.class.id,
        name: exam.class.name,
      } : null,
      examType: {
        name: exam.examTypeEnum.replace('_', ' '),
      },
      subjects,
      gradeDistribution,
      overallStats,
      topPerformers,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching exam detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam detail" },
      { status: 500 }
    );
  }
}
