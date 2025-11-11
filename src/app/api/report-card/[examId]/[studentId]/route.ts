import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string; studentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const studentId = params.studentId;

    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    // Access control: students can only view their own reports, parents can view their children's reports
    if (user.role === "student" && user.id !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (user.role === "parent") {
      // Check if this student is the user's child
      const parentStudent = await prisma.student.findFirst({
        where: {
          id: studentId,
          parentId: user.id,
        },
      });
      if (!parentStudent) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        studentId: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get student's exam results
    const examResults = await prisma.examResult.findMany({
      where: {
        examId,
        studentId,
      },
      include: {
        examSubject: {
          include: {
            subject: true,
            teacher: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    // Process results and calculate grades
    const results = examResults.map(result => {
      const percentage = (result.marks / result.examSubject.maxMarks) * 100;
      let grade = "F";
      if (percentage >= 90) grade = "A+";
      else if (percentage >= 80) grade = "A";
      else if (percentage >= 70) grade = "B+";
      else if (percentage >= 60) grade = "B";
      else if (percentage >= 50) grade = "C+";
      else if (percentage >= 40) grade = "C";
      else if (percentage >= 30) grade = "D";

      return {
        subject: {
          id: result.examSubject.subject.id,
          name: result.examSubject.subject.name,
          code: result.examSubject.subject.code,
        },
        marks: result.marks,
        maxMarks: result.examSubject.maxMarks,
        percentage,
        grade,
        teacher: result.examSubject.teacher,
      };
    });

    // Calculate overall performance
    const totalMarks = results.reduce((sum, r) => sum + r.marks, 0);
    const totalMaxMarks = results.reduce((sum, r) => sum + r.maxMarks, 0);
    const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    
    let overallGrade = "F";
    if (overallPercentage >= 90) overallGrade = "A+";
    else if (overallPercentage >= 80) overallGrade = "A";
    else if (overallPercentage >= 70) overallGrade = "B+";
    else if (overallPercentage >= 60) overallGrade = "B";
    else if (overallPercentage >= 50) overallGrade = "C+";
    else if (overallPercentage >= 40) overallGrade = "C";
    else if (overallPercentage >= 30) overallGrade = "D";

    // Get all students in the same grade for ranking
    const allStudentsInGrade = await prisma.student.findMany({
      where: { gradeId: exam.gradeId },
      include: {
        examResults: {
          where: { examId },
        },
      },
    });

    // Calculate ranks and class stats
    const studentTotals = allStudentsInGrade.map(s => {
      const studentTotal = s.examResults.reduce((sum, r) => sum + r.marks, 0);
      return {
        id: s.id,
        totalMarks: studentTotal,
      };
    }).sort((a, b) => b.totalMarks - a.totalMarks);

    const classRank = studentTotals.findIndex(s => s.id === studentId) + 1;
    const classSize = studentTotals.length;

    // Class statistics
    const allTotalMarks = studentTotals.map(s => s.totalMarks);
    const classTotalSum = allTotalMarks.reduce((sum, marks) => sum + marks, 0);
    const classAverageMarks = classSize > 0 ? classTotalSum / classSize : 0;
    const classAveragePercentage = totalMaxMarks > 0 ? (classAverageMarks / totalMaxMarks) * 100 : 0;

    const classStats = {
      averageMarks: Math.round(classAverageMarks * 100) / 100,
      averagePercentage: Math.round(classAveragePercentage * 100) / 100,
      highestMarks: allTotalMarks.length > 0 ? Math.max(...allTotalMarks) : 0,
      lowestMarks: allTotalMarks.length > 0 ? Math.min(...allTotalMarks) : 0,
    };

    return NextResponse.json({
      student,
      exam: {
        id: exam.id,
        title: exam.title,
        year: exam.year,
        term: exam.term,
        examTypeEnum: exam.examTypeEnum,
        grade: exam.grade,
      },
      results,
      summary: {
        totalMarks,
        totalMaxMarks,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        overallGrade,
        classRank,
        classSize,
      },
      classStats,
    });

  } catch (error) {
    console.error("Error fetching report card:", error);
    return NextResponse.json(
      { error: "Failed to fetch report card" },
      { status: 500 }
    );
  }
}
