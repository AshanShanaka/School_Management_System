import prisma from "@/lib/prisma";

interface SubjectMark {
  subjectId: number;
  subjectName: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  teacherName?: string;
}

interface ReportCardData {
  studentId: string;
  studentName: string;
  studentSurname: string;
  className: string;
  examTitle: string;
  year: number;
  term: number;
  subjects: SubjectMark[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  average: number;
  overallGrade: string;
  classRank: number;
  classSize: number;
}

/**
 * Calculate grade based on percentage
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 35) return "S";
  return "F";
}

/**
 * Fetch all exam results for a specific exam and class
 */
export async function fetchExamResults(examId: number, classId: number) {
  try {
    const examResults = await prisma.examResult.findMany({
      where: {
        examId: examId,
        student: {
          classId: classId,
        },
      },
      include: {
        student: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
        exam: {
          include: {
            grade: true,
            examType: true,
          },
        },
        examSubject: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
      orderBy: [
        { student: { name: "asc" } },
        { examSubject: { subject: { name: "asc" } } },
      ],
    });

    return examResults;
  } catch (error) {
    console.error("Error fetching exam results:", error);
    throw new Error("Failed to fetch exam results");
  }
}

/**
 * Group exam results by student
 */
export function groupResultsByStudent(examResults: any[]) {
  const studentResults = new Map<string, any>();

  examResults.forEach((result) => {
    if (!studentResults.has(result.studentId)) {
      studentResults.set(result.studentId, {
        student: result.student,
        exam: result.exam,
        subjects: [],
      });
    }

    studentResults.get(result.studentId)!.subjects.push({
      subjectId: result.examSubject.subject.id,
      subjectName: result.examSubject.subject.name,
      marks: result.marks,
      maxMarks: result.examSubject.maxMarks,
      grade: result.grade,
      teacherName: result.examSubject.teacher
        ? `${result.examSubject.teacher.name} ${result.examSubject.teacher.surname}`
        : undefined,
    });
  });

  return studentResults;
}

/**
 * Calculate totals and statistics for each student
 */
export function calculateStudentStatistics(
  studentResults: Map<string, any>
): Map<string, ReportCardData> {
  const reportCards = new Map<string, ReportCardData>();

  // First pass: Calculate totals and percentages
  studentResults.forEach((data, studentId) => {
    const subjects: SubjectMark[] = data.subjects.map((subject: any) => {
      const percentage = (subject.marks / subject.maxMarks) * 100;
      const grade = subject.grade || calculateGrade(percentage);

      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        marks: subject.marks,
        maxMarks: subject.maxMarks,
        percentage: Number(percentage.toFixed(2)),
        grade: grade,
        teacherName: subject.teacherName,
      };
    });

    const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0);
    const totalMaxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage =
      totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const average = subjects.length > 0 ? percentage : 0;
    const overallGrade = calculateGrade(percentage);

    reportCards.set(studentId, {
      studentId: data.student.id,
      studentName: data.student.name,
      studentSurname: data.student.surname,
      className: data.student.class.name,
      examTitle: data.exam.title,
      year: data.exam.year,
      term: data.exam.term,
      subjects: subjects,
      totalMarks: totalMarks,
      totalMaxMarks: totalMaxMarks,
      percentage: Number(percentage.toFixed(2)),
      average: Number(average.toFixed(2)),
      overallGrade: overallGrade,
      classRank: 0, // Will be calculated in next step
      classSize: studentResults.size,
    });
  });

  // Second pass: Calculate ranks
  const sortedByPercentage = Array.from(reportCards.values()).sort(
    (a, b) => b.percentage - a.percentage
  );

  sortedByPercentage.forEach((card, index) => {
    const updatedCard = reportCards.get(card.studentId)!;
    updatedCard.classRank = index + 1;
    reportCards.set(card.studentId, updatedCard);
  });

  return reportCards;
}

/**
 * Generate report cards for an exam and class
 */
export async function generateReportCards(
  examId: number,
  classId: number
): Promise<ReportCardData[]> {
  try {
    // Fetch all exam results
    const examResults = await fetchExamResults(examId, classId);

    if (examResults.length === 0) {
      throw new Error("No exam results found for this exam and class");
    }

    // Group by student
    const studentResults = groupResultsByStudent(examResults);

    // Calculate statistics
    const reportCards = calculateStudentStatistics(studentResults);

    // Convert to array
    return Array.from(reportCards.values()).sort(
      (a, b) => a.classRank - b.classRank
    );
  } catch (error) {
    console.error("Error generating report cards:", error);
    throw error;
  }
}

/**
 * Save generated report cards to database with generation label
 */
export async function saveReportCards(
  reportCardsData: ReportCardData[],
  examId: number,
  classId: number,
  teacherId?: string
) {
  try {
    const reportCards = [];

    // Get exam and class details for the generation label
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examType: true,
        grade: true,
      },
    });

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        grade: true,
      },
    });

    if (!exam || !classData) {
      throw new Error("Exam or class not found");
    }

    // Create generation label
    const averagePercentage =
      reportCardsData.reduce((sum, card) => sum + card.percentage, 0) /
      reportCardsData.length;

    const generationLabel = `${exam.year} Term ${exam.term} ${exam.title} - ${classData.name}`;

    const generation = await prisma.reportCardGeneration.create({
      data: {
        examId: examId,
        classId: classId,
        teacherId: teacherId || "system",
        label: generationLabel,
        examTitle: exam.title,
        examYear: exam.year,
        examTerm: exam.term,
        examType: exam.examType?.name || exam.examTypeEnum,
        className: classData.name,
        gradeLevel: classData.grade.level,
        totalStudents: reportCardsData.length,
        averagePercentage: averagePercentage,
        status: "COMPLETED",
      },
    });

    for (const data of reportCardsData) {
      // Check if report card already exists
      const existing = await prisma.reportCard.findFirst({
        where: {
          examId: examId,
          studentId: data.studentId,
        },
      });

      if (existing) {
        // Update existing report card
        const updated = await prisma.reportCard.update({
          where: { id: existing.id },
          data: {
            classId: classId,
            generationId: generation.id,
            status: "PUBLISHED",
            percentage: data.percentage,
            overallGrade: data.overallGrade,
            classRank: data.classRank,
            totalMarks: data.totalMarks,
            maxMarks: data.totalMaxMarks,
            generatedAt: new Date(),
          },
        });
        reportCards.push(updated);
      } else {
        // Create new report card
        const created = await prisma.reportCard.create({
          data: {
            examId: examId,
            classId: classId,
            studentId: data.studentId,
            generationId: generation.id,
            status: "PUBLISHED",
            percentage: data.percentage,
            overallGrade: data.overallGrade,
            classRank: data.classRank,
            totalMarks: data.totalMarks,
            maxMarks: data.totalMaxMarks,
            generatedAt: new Date(),
          },
        });
        reportCards.push(created);
      }

      // Also create/update exam summary
      const existingSummary = await prisma.examSummary.findFirst({
        where: {
          examId: examId,
          studentId: data.studentId,
        },
      });

      // Calculate class average
      const classAverage =
        reportCardsData.reduce((sum, card) => sum + card.percentage, 0) /
        reportCardsData.length;

      if (existingSummary) {
        await prisma.examSummary.update({
          where: { id: existingSummary.id },
          data: {
            totalMarks: data.totalMarks,
            totalMaxMarks: data.totalMaxMarks,
            percentage: data.percentage,
            average: classAverage,
            overallGrade: data.overallGrade,
            classRank: data.classRank,
            classSize: data.classSize,
          },
        });
      } else {
        await prisma.examSummary.create({
          data: {
            examId: examId,
            studentId: data.studentId,
            totalMarks: data.totalMarks,
            totalMaxMarks: data.totalMaxMarks,
            percentage: data.percentage,
            average: classAverage,
            overallGrade: data.overallGrade,
            classRank: data.classRank,
            classSize: data.classSize,
          },
        });
      }
    }

    // Return both the report cards and the generation info
    return { reportCards, generation };
  } catch (error) {
    console.error("Error saving report cards:", error);
    throw new Error("Failed to save report cards to database");
  }
}

/**
 * Get report card data for a specific student and exam
 */
export async function getStudentReportCard(
  examId: number,
  studentId: string
): Promise<ReportCardData | null> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const reportCards = await generateReportCards(examId, student.classId);
    return reportCards.find((card) => card.studentId === studentId) || null;
  } catch (error) {
    console.error("Error getting student report card:", error);
    throw error;
  }
}

export type { ReportCardData, SubjectMark };
