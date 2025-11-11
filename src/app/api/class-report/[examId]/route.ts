import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can view class reports
    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
        examSubjects: {
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
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // For teachers, check if they're assigned to this exam or are class teacher for this grade
    if (user.role === "teacher") {
      const isAssignedToExam = exam.examSubjects.some(es => es.teacherId === user.id);
      // TODO: Check if user is class teacher for this grade
      // For now, allow all teachers to view class reports
      if (!isAssignedToExam) {
        return NextResponse.json({ 
          error: "You don't have permission to view this class report" 
        }, { status: 403 });
      }
    }

    // Get all students for this grade
    const students = await prisma.student.findMany({
      where: { gradeId: exam.gradeId },
      include: {
        examResults: {
          where: { examId },
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
        },
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    });

    // Process student data and calculate grades/ranks
    const studentsWithResults = students.map(student => {
      const results = student.examResults.map(result => {
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
          subject: result.examSubject.subject,
          marks: result.marks,
          maxMarks: result.examSubject.maxMarks,
          percentage,
          grade,
        };
      });

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

      return {
        id: student.id,
        name: student.name,
        surname: student.surname,
        username: student.username,
        results,
        totalMarks,
        totalMaxMarks,
        overallPercentage,
        overallGrade,
        classRank: 0, // Will be calculated after sorting
      };
    });

    // Sort by total marks and assign ranks
    studentsWithResults.sort((a, b) => b.totalMarks - a.totalMarks);
    studentsWithResults.forEach((student, index) => {
      student.classRank = index + 1;
    });

    // Calculate class statistics
    const totalStudents = studentsWithResults.length;
    const totalMarksSum = studentsWithResults.reduce((sum, s) => sum + s.totalMarks, 0);
    const totalPercentageSum = studentsWithResults.reduce((sum, s) => sum + s.overallPercentage, 0);
    const allMarks = studentsWithResults.map(s => s.totalMarks);
    
    const classStats = {
      totalStudents,
      averageMarks: totalStudents > 0 ? Math.round((totalMarksSum / totalStudents) * 100) / 100 : 0,
      averagePercentage: totalStudents > 0 ? Math.round((totalPercentageSum / totalStudents) * 100) / 100 : 0,
      highestMarks: allMarks.length > 0 ? Math.max(...allMarks) : 0,
      lowestMarks: allMarks.length > 0 ? Math.min(...allMarks) : 0,
    };

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        grade: exam.grade,
      },
      classStats,
      students: studentsWithResults,
    });

  } catch (error) {
    console.error("Error fetching class report:", error);
    return NextResponse.json(
      { error: "Failed to fetch class report" },
      { status: 500 }
    );
  }
}
