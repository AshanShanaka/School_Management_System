import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { calculateGrade } from "@/lib/grading";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { examSubjectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const examSubjectId = parseInt(params.examSubjectId);
    if (isNaN(examSubjectId)) {
      return NextResponse.json({ error: "Invalid exam subject ID" }, { status: 400 });
    }

    // Get exam subject details
    const examSubject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: {
        subject: true,
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
        exam: {
          include: {
            grade: true,
          },
        },
        subjectResults: {
          include: {
            student: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!examSubject) {
      return NextResponse.json({ error: "Exam subject not found" }, { status: 404 });
    }

    // Check permissions
    if (user.role === "teacher") {
      // Check if teacher is teaching this subject or is class teacher for this grade
      const isTeachingSubject = examSubject.teacherId === user.id;
      const isClassTeacher = await prisma.class.findFirst({
        where: {
          gradeId: examSubject.exam.gradeId,
          classTeacherId: user.id,
        },
      });

      if (!isTeachingSubject && !isClassTeacher) {
        return NextResponse.json(
          { error: "You don't have access to view these marks" },
          { status: 403 }
        );
      }
    }

    // Process student marks
    const students = examSubject.subjectResults.map((result) => {
      const percentage = (result.marks / examSubject.maxMarks) * 100;
      
      let grade = result.grade === "AB" ? "AB" : calculateGrade(percentage);

      return {
        studentId: result.studentId,
        studentName: result.student.name,
        studentSurname: result.student.surname,
        username: result.student.username,
        className: result.student.class.name,
        marks: result.marks,
        grade: grade,
        percentage: percentage,
      };
    });

    // Calculate statistics
    const validMarks = students.filter(s => s.grade !== "AB");
    const totalStudents = await prisma.student.count({
      where: { gradeId: examSubject.exam.gradeId },
    });

    let averageMarks = 0;
    let averagePercentage = 0;
    let highestMarks = 0;
    let lowestMarks = 0;
    let passRate = 0;

    if (validMarks.length > 0) {
      const marksArray = validMarks.map(s => s.marks);
      averageMarks = marksArray.reduce((sum, m) => sum + m, 0) / validMarks.length;
      averagePercentage = validMarks.reduce((sum, s) => sum + s.percentage, 0) / validMarks.length;
      highestMarks = Math.max(...marksArray);
      lowestMarks = Math.min(...marksArray);
      
      const passMarks = examSubject.maxMarks * 0.35; // 35% to pass
      const passedStudents = validMarks.filter(s => s.marks >= passMarks).length;
      passRate = (passedStudents / validMarks.length) * 100;
    }

    // Grade distribution
    const gradeDistribution: { [key: string]: number } = {};
    students.forEach(s => {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
    });

    return NextResponse.json({
      examSubject: {
        id: examSubject.id,
        subjectName: examSubject.subject.name,
        maxMarks: examSubject.maxMarks,
        marksEntered: examSubject.marksEntered,
        marksEnteredAt: examSubject.marksEnteredAt,
        teacherName: examSubject.teacher
          ? `${examSubject.teacher.name} ${examSubject.teacher.surname}`
          : "Not Assigned",
      },
      exam: {
        id: examSubject.exam.id,
        title: examSubject.exam.title,
        year: examSubject.exam.year,
        term: examSubject.exam.term,
        gradeLevel: examSubject.exam.grade.level,
      },
      statistics: {
        totalStudents,
        studentsWithMarks: students.length,
        averageMarks: Math.round(averageMarks * 10) / 10,
        averagePercentage: Math.round(averagePercentage * 10) / 10,
        highestMarks,
        lowestMarks,
        passRate: Math.round(passRate * 10) / 10,
      },
      gradeDistribution,
      students: students.sort((a, b) => b.marks - a.marks),
    });
  } catch (error) {
    console.error("Error fetching subject marks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject marks" },
      { status: 500 }
    );
  }
}
