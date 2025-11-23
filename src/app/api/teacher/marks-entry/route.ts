import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateGrade } from "@/lib/grading";

// Calculate class statistics
async function calculateClassStatistics(examId: number, examSubjectId: number) {
  const results = await prisma.examResult.findMany({
    where: {
      examId,
      examSubjectId,
    },
    include: {
      examSubject: true,
    },
  });

  if (results.length === 0) return null;

  const percentages = results.map(r => (r.marks / r.examSubject.maxMarks) * 100);
  const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const highest = Math.max(...percentages);
  const lowest = Math.min(...percentages);
  const passCount = percentages.filter(p => p >= 60).length;
  const passRate = (passCount / percentages.length) * 100;

  return { average, highest, lowest, passRate };
}

// Generate exam summary for a student
async function generateExamSummary(examId: number, studentId: string) {
  // Get all results for this student in this exam
  const results = await prisma.examResult.findMany({
    where: {
      examId,
      studentId,
    },
    include: {
      examSubject: true,
    },
  });

  if (results.length === 0) return null;

  const totalMarks = results.reduce((sum, r) => sum + r.marks, 0);
  const totalMaxMarks = results.reduce((sum, r) => sum + r.examSubject.maxMarks, 0);
  const percentage = (totalMarks / totalMaxMarks) * 100;
  const overallGrade = calculateGrade(percentage);

  // Calculate class average for comparison
  const allStudentResults = await prisma.examResult.findMany({
    where: {
      examId,
      examSubjectId: { in: results.map(r => r.examSubjectId) },
    },
    include: {
      examSubject: true,
      student: {
        include: {
          class: true,
        },
      },
    },
  });

  // Group by student and calculate their totals
  const studentTotals = allStudentResults.reduce((acc: any, result) => {
    const key = result.studentId;
    if (!acc[key]) {
      acc[key] = {
        studentId: key,
        classId: result.student.class.id,
        totalMarks: 0,
        totalMaxMarks: 0,
      };
    }
    acc[key].totalMarks += result.marks;
    acc[key].totalMaxMarks += result.examSubject.maxMarks;
    return acc;
  }, {});

  // Get current student's class
  const currentStudent = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });

  if (!currentStudent) return null;

  // Filter students from the same class
  const classStudentTotals = Object.values(studentTotals).filter(
    (s: any) => s.classId === currentStudent.class.id
  );

  // Calculate class average
  const classPercentages = classStudentTotals.map((s: any) => (s.totalMarks / s.totalMaxMarks) * 100);
  const average = classPercentages.reduce((sum: number, p: number) => sum + p, 0) / classPercentages.length;

  // Calculate rank
  const sortedPercentages = classPercentages.sort((a, b) => b - a);
  const classRank = sortedPercentages.indexOf(percentage) + 1;
  const classSize = classPercentages.length;

  return {
    totalMarks,
    totalMaxMarks,
    percentage,
    average,
    overallGrade,
    classRank,
    classSize,
  };
}

// Check if all subjects for an exam are completed
async function checkExamCompletion(examId: number, studentId: string) {
  const examSubjects = await prisma.examSubject.findMany({
    where: { examId },
  });

  const studentResults = await prisma.examResult.findMany({
    where: {
      examId,
      studentId,
    },
  });

  return examSubjects.length === studentResults.length;
}

// Generate report card
async function generateReportCard(examId: number, studentId: string) {
  const examSummary = await prisma.examSummary.findFirst({
    where: {
      examId,
      studentId,
    },
  });

  if (!examSummary) return null;

  const results = await prisma.examResult.findMany({
    where: {
      examId,
      studentId,
    },
    include: {
      examSubject: {
        include: {
          subject: true,
        },
      },
    },
  });

  // Calculate subject-wise class averages
  const subjectData = await Promise.all(
    results.map(async (result) => {
      const classStats = await calculateClassStatistics(examId, result.examSubjectId);
      return {
        marks: result.marks,
        maxMarks: result.examSubject.maxMarks,
        grade: result.grade,
        classAverage: classStats?.average || 0,
        subject: result.examSubject.subject,
      };
    })
  );

  // Create or update report card
  const reportCard = await prisma.reportCard.upsert({
    where: {
      examId_studentId: {
        examId,
        studentId,
      },
    },
    update: {
      status: "published",
      totalMarks: examSummary.totalMarks,
      maxMarks: examSummary.totalMaxMarks,
      percentage: examSummary.percentage,
      overallGrade: examSummary.overallGrade,
      classRank: examSummary.classRank,
      classAverage: examSummary.average,
      generatedAt: new Date(),
    },
    create: {
      examId,
      studentId,
      status: "published",
      totalMarks: examSummary.totalMarks,
      maxMarks: examSummary.totalMaxMarks,
      percentage: examSummary.percentage,
      overallGrade: examSummary.overallGrade,
      classRank: examSummary.classRank,
      classAverage: examSummary.average,
      generatedAt: new Date(),
    },
  });

  // Create report card subjects
  await Promise.all(
    subjectData.map(async (subject) => {
      await prisma.reportCardSubject.upsert({
        where: {
          reportCardId_subjectId: {
            reportCardId: reportCard.id,
            subjectId: subject.subject.id,
          },
        },
        update: {
          marks: subject.marks,
          maxMarks: subject.maxMarks,
          grade: subject.grade,
          classAverage: subject.classAverage,
        },
        create: {
          reportCardId: reportCard.id,
          subjectId: subject.subject.id,
          marks: subject.marks,
          maxMarks: subject.maxMarks,
          grade: subject.grade,
          classAverage: subject.classAverage,
        },
      });
    })
  );

  return reportCard;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { examId, examSubjectId, marks } = body;

    if (!examId || !examSubjectId || !Array.isArray(marks)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Verify teacher has permission to enter marks for this exam subject
    const examSubject = await prisma.examSubject.findFirst({
      where: {
        id: examSubjectId,
        examId,
        teacherId: user.id,
      },
      include: {
        exam: {
          include: {
            grade: true,
          },
        },
        subject: true,
      },
    });

    if (!examSubject) {
      return NextResponse.json({ error: "You don't have permission to enter marks for this subject" }, { status: 403 });
    }

    // Validate marks data
    for (const mark of marks) {
      if (!mark.studentId || typeof mark.marks !== "number" || mark.marks < 0 || mark.marks > examSubject.maxMarks) {
        return NextResponse.json({ 
          error: `Invalid marks for student ${mark.studentId}. Marks should be between 0 and ${examSubject.maxMarks}` 
        }, { status: 400 });
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const updatedResults = [];
      const examSummariesToUpdate = new Set<string>();

      // Process each mark entry
      for (const mark of marks) {
        const percentage = (mark.marks / examSubject.maxMarks) * 100;
        const grade = calculateGrade(percentage);

        // Upsert exam result
        const examResult = await tx.examResult.upsert({
          where: {
            examId_examSubjectId_studentId: {
              examId,
              examSubjectId,
              studentId: mark.studentId,
            },
          },
          update: {
            marks: mark.marks,
            grade,
          },
          create: {
            examId,
            examSubjectId,
            studentId: mark.studentId,
            marks: mark.marks,
            grade,
          },
        });

        updatedResults.push(examResult);
        examSummariesToUpdate.add(mark.studentId);
      }

      // Update exam summaries for affected students
      for (const studentId of Array.from(examSummariesToUpdate)) {
        const summaryData = await generateExamSummary(examId, studentId);
        
        if (summaryData) {
          await tx.examSummary.upsert({
            where: {
              examId_studentId: {
                examId,
                studentId,
              },
            },
            update: summaryData,
            create: {
              examId,
              studentId,
              ...summaryData,
            },
          });

          // Check if exam is complete for this student and generate report card
          const isComplete = await checkExamCompletion(examId, studentId);
          if (isComplete) {
            // Generate report card in a separate process to avoid blocking
            generateReportCard(examId, studentId).catch(console.error);
          }
        }
      }

      return { updatedResults: updatedResults.length };
    });

    return NextResponse.json({
      message: "Marks entered successfully",
      updatedCount: result.updatedResults,
    });

  } catch (error) {
    console.error("Error entering marks:", error);
    return NextResponse.json(
      { error: "Failed to enter marks" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = parseInt(searchParams.get("examId") || "0");
    const examSubjectId = parseInt(searchParams.get("examSubjectId") || "0");

    if (!examId || !examSubjectId) {
      return NextResponse.json({ error: "Missing examId or examSubjectId" }, { status: 400 });
    }

    // Get existing marks for this exam subject
    const results = await prisma.examResult.findMany({
      where: {
        examId,
        examSubjectId,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        examSubject: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        student: {
          user: {
            name: "asc",
          },
        },
      },
    });

    // Calculate statistics
    const stats = await calculateClassStatistics(examId, examSubjectId);

    return NextResponse.json({
      results,
      statistics: stats,
    });

  } catch (error) {
    console.error("Error fetching marks:", error);
    return NextResponse.json(
      { error: "Failed to fetch marks" },
      { status: 500 }
    );
  }
}
