import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/report-cards/generate/[examId]/[classId] - Generate report cards for a class
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string; classId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const classId = parseInt(params.classId);

    // Check if user is class teacher or admin
    if (user.role === "teacher") {
      const classTeacher = await prisma.class.findFirst({
        where: {
          id: classId,
          supervisorId: user.id,
        },
      });

      if (!classTeacher) {
        return NextResponse.json(
          { error: "You don't have permission to generate report cards for this class" },
          { status: 403 }
        );
      }
    } else if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if all marks are entered
    const examSubjects = await prisma.examSubject.findMany({
      where: { examId },
      include: { subject: true },
    });

    const incompleteSubjects = examSubjects.filter(subject => !subject.marksEntered);
    if (incompleteSubjects.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot generate report cards. The following subjects don't have marks entered yet",
          incompleteSubjects: incompleteSubjects.map(s => s.subject.name)
        },
        { status: 400 }
      );
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        examResults: {
          where: { examId },
          include: {
            examSubject: {
              include: { subject: true },
            },
          },
        },
      },
    });

    // Calculate grades and generate report cards
    const calculateGrade = (marks: number, maxMarks: number): string => {
      const percentage = (marks / maxMarks) * 100;
      if (percentage >= 85) return "A";
      if (percentage >= 70) return "B";
      if (percentage >= 55) return "C";
      if (percentage >= 40) return "S";
      return "F";
    };

    const generateRemarks = (percentage: number): string => {
      if (percentage >= 85) return "Excellent performance";
      if (percentage >= 70) return "Good performance";
      if (percentage >= 55) return "Satisfactory performance";
      if (percentage >= 40) return "Needs improvement";
      return "Poor performance - requires attention";
    };

    await prisma.$transaction(async (tx) => {
      // Delete existing report cards for this exam and class
      await tx.reportCard.deleteMany({
        where: { examId, classId },
      });

      // Calculate class averages for each subject
      const subjectAverages: Record<number, number> = {};
      
      for (const examSubject of examSubjects) {
        const subjectResults = await tx.examResult.findMany({
          where: {
            examId,
            examSubjectId: examSubject.id,
          },
        });

        if (subjectResults.length > 0) {
          const total = subjectResults.reduce((sum, result) => sum + result.marks, 0);
          subjectAverages[examSubject.subjectId] = total / subjectResults.length;
        }
      }

      // Generate report cards for each student
      for (const student of students) {
        const studentResults = student.examResults;
        
        if (studentResults.length > 0) {
          const totalMarks = studentResults.reduce((sum, result) => sum + result.marks, 0);
          const maxMarks = studentResults.reduce((sum, result) => sum + result.examSubject.maxMarks, 0);
          const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
          const overallGrade = calculateGrade(totalMarks, maxMarks);

          // Create report card
          const reportCard = await tx.reportCard.create({
            data: {
              examId,
              classId,
              studentId: student.id,
              totalMarks,
              maxMarks,
              percentage,
              overallGrade,
              status: "DRAFT",
            },
          });

          // Create subject entries
          for (const result of studentResults) {
            await tx.reportCardSubject.create({
              data: {
                reportCardId: reportCard.id,
                subjectId: result.examSubject.subjectId,
                marks: result.marks,
                maxMarks: result.examSubject.maxMarks,
                grade: result.grade || calculateGrade(result.marks, result.examSubject.maxMarks),
                classAverage: subjectAverages[result.examSubject.subjectId] || 0,
                remarks: generateRemarks((result.marks / result.examSubject.maxMarks) * 100),
              },
            });
          }
        }
      }

      // Calculate class ranks
      const reportCards = await tx.reportCard.findMany({
        where: { examId, classId },
        orderBy: { percentage: "desc" },
      });

      for (let i = 0; i < reportCards.length; i++) {
        await tx.reportCard.update({
          where: { id: reportCards[i].id },
          data: { 
            classRank: i + 1,
            classAverage: reportCards.reduce((sum, rc) => sum + (rc.percentage || 0), 0) / reportCards.length,
          },
        });
      }

      // Update workflow stage
      await tx.reportWorkflow.upsert({
        where: {
          examId_classId: {
            examId,
            classId,
          },
        },
        create: {
          examId,
          classId,
          currentStage: "CLASS_REVIEW",
          marksComplete: true,
        },
        update: {
          currentStage: "CLASS_REVIEW",
          marksComplete: true,
        },
      });
    });

    return NextResponse.json({ 
      message: "Report cards generated successfully",
      studentsProcessed: students.length,
    });

  } catch (error) {
    console.error("Error generating report cards:", error);
    return NextResponse.json(
      { error: "Failed to generate report cards" },
      { status: 500 }
    );
  }
}
