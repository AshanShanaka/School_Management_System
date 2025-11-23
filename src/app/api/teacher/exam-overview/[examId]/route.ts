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
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check if user is class teacher for this grade
    const isClassTeacher = await prisma.class.findFirst({
      where: {
        gradeId: exam.gradeId,
        classTeacherId: user.id,
      },
    });

    // Get subjects teacher is teaching
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: {
        subjects: true,
      },
    });

    const teachingSubjectIds = teacher?.subjects.map(s => s.id) || [];
    const isSubjectTeacher = teachingSubjectIds.length > 0;

    // Check if teacher has access to this exam
    if (user.role === "teacher" && !isClassTeacher && !isSubjectTeacher) {
      return NextResponse.json(
        { error: "You don't have access to this exam" },
        { status: 403 }
      );
    }

    // Get all exam subjects with marks data
    const examSubjects = await prisma.examSubject.findMany({
      where: { examId },
      include: {
        subject: true,
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
        subjectResults: {
          select: {
            marks: true,
          },
        },
      },
    });

    // Get total students count
    const totalStudents = await prisma.student.count({
      where: { gradeId: exam.gradeId },
    });

    // Process subject data
    const subjects = examSubjects.map((examSubject) => {
      const results = examSubject.subjectResults;
      const studentsWithMarks = results.length;
      
      let averageMarks = null;
      let highestMarks = null;
      let lowestMarks = null;

      if (results.length > 0) {
        const marks = results.map(r => r.marks).filter((m): m is number => m !== null);
        if (marks.length > 0) {
          averageMarks = marks.reduce((sum, m) => sum + m, 0) / marks.length;
          highestMarks = Math.max(...marks);
          lowestMarks = Math.min(...marks);
        }
      }

      return {
        id: examSubject.id,
        subjectId: examSubject.subjectId,
        subjectName: examSubject.subject.name,
        teacherId: examSubject.teacherId,
        teacherName: examSubject.teacher 
          ? `${examSubject.teacher.name} ${examSubject.teacher.surname}`
          : "Not Assigned",
        maxMarks: examSubject.maxMarks,
        marksEntered: examSubject.marksEntered,
        marksEnteredAt: examSubject.marksEnteredAt,
        totalStudents,
        studentsWithMarks,
        averageMarks,
        highestMarks,
        lowestMarks,
      };
    });

    // Calculate overall stats
    const completedSubjects = subjects.filter(s => s.marksEntered).length;
    const pendingSubjects = subjects.length - completedSubjects;

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        year: exam.year,
        term: exam.term,
        status: exam.status,
        grade: exam.grade,
      },
      isClassTeacher: !!isClassTeacher,
      isSubjectTeacher,
      teachingSubjects: teachingSubjectIds,
      subjects,
      overallStats: {
        totalSubjects: subjects.length,
        completedSubjects,
        pendingSubjects,
        totalStudents,
      },
    });
  } catch (error) {
    console.error("Error fetching exam overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam overview" },
      { status: 500 }
    );
  }
}
