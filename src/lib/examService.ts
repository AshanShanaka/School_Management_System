/**
 * Exam Service - Business logic for exam management
 * Handles exam timetable, marks entry, and report card generation
 */

import prisma from "@/lib/prisma";
import { ExamStatus, ExamTypeEnum } from "@prisma/client";

// ==================== TYPES ====================

export interface ExamTimetableSlot {
  examSubjectId: number;
  subjectId: number;
  subjectName: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  teacherId?: string;
  teacherName?: string;
}

export interface StudentMarkEntry {
  studentId: string;
  studentName: string;
  marks: number | null;
  isAbsent: boolean;
  grade?: string;
}

export interface SubjectResult {
  subjectId: number;
  subjectName: string;
  marks: number | null;
  maxMarks: number;
  grade: string;
  isAbsent: boolean;
}

export interface ReportCardData {
  studentId: string;
  studentName: string;
  className: string;
  examTitle: string;
  term: number;
  year: number;
  subjects: SubjectResult[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  average: number;
  overallGrade: string;
  classRank: number;
  classSize: number;
}

// ==================== ADMIN: EXAM TIMETABLE ====================

/**
 * Create or update exam with timetable (exam sessions)
 */
export async function createExamTimetable(data: {
  title: string;
  examTypeEnum: ExamTypeEnum;
  gradeId: number;
  classId?: number;
  term: number;
  year: number;
  subjects: Array<{
    subjectId: number;
    teacherId?: string;
    examDate: Date;
    startTime: string;
    endTime: string;
    maxMarks: number;
  }>;
  marksEntryDeadline?: Date;
  reviewDeadline?: Date;
}) {
  // Check if exam already exists
  const existingExam = await prisma.exam.findFirst({
    where: {
      year: data.year,
      term: data.term,
      gradeId: data.gradeId,
      examTypeEnum: data.examTypeEnum,
      ...(data.classId && { classId: data.classId }),
    },
  });

  if (existingExam) {
    // Update existing exam
    return await prisma.exam.update({
      where: { id: existingExam.id },
      data: {
        title: data.title,
        status: ExamStatus.PUBLISHED,
        publishedAt: new Date(),
        marksEntryDeadline: data.marksEntryDeadline,
        reviewDeadline: data.reviewDeadline,
        examSubjects: {
          deleteMany: {},
          create: data.subjects.map((sub) => ({
            subjectId: sub.subjectId,
            teacherId: sub.teacherId,
            examDate: sub.examDate,
            startTime: sub.startTime,
            endTime: sub.endTime,
            maxMarks: sub.maxMarks,
          })),
        },
      },
      include: {
        examSubjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        grade: true,
        class: true,
      },
    });
  }

  // Create new exam
  return await prisma.exam.create({
    data: {
      title: data.title,
      examTypeEnum: data.examTypeEnum,
      gradeId: data.gradeId,
      classId: data.classId,
      term: data.term,
      year: data.year,
      status: ExamStatus.PUBLISHED,
      publishedAt: new Date(),
      marksEntryDeadline: data.marksEntryDeadline,
      reviewDeadline: data.reviewDeadline,
      examSubjects: {
        create: data.subjects.map((sub) => ({
          subjectId: sub.subjectId,
          teacherId: sub.teacherId,
          examDate: sub.examDate,
          startTime: sub.startTime,
          endTime: sub.endTime,
          maxMarks: sub.maxMarks,
        })),
      },
    },
    include: {
      examSubjects: {
        include: {
          subject: true,
          teacher: true,
        },
      },
      grade: true,
      class: true,
    },
  });
}

/**
 * Get all published exams (visible to all users)
 */
export async function getPublishedExams(filters?: {
  gradeId?: number;
  classId?: number;
  year?: number;
  term?: number;
}) {
  return await prisma.exam.findMany({
    where: {
      status: ExamStatus.PUBLISHED,
      ...(filters?.gradeId && { gradeId: filters.gradeId }),
      ...(filters?.classId && { classId: filters.classId }),
      ...(filters?.year && { year: filters.year }),
      ...(filters?.term && { term: filters.term }),
    },
    include: {
      grade: true,
      class: true,
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
        orderBy: {
          examDate: "asc",
        },
      },
    },
    orderBy: [{ year: "desc" }, { term: "desc" }, { examSubjects: { _count: "desc" } }],
  });
}

/**
 * Get exam timetable by ID
 */
export async function getExamTimetable(examId: number) {
  return await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      grade: true,
      class: true,
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
        orderBy: {
          examDate: "asc",
        },
      },
    },
  });
}

// ==================== SUBJECT TEACHER: MARKS ENTRY ====================

/**
 * Get students for a class to enter marks
 */
export async function getStudentsForMarksEntry(
  examId: number,
  classId: number,
  subjectId: number
) {
  // Get exam subject
  const examSubject = await prisma.examSubject.findFirst({
    where: {
      examId,
      subjectId,
    },
    include: {
      exam: true,
      subject: true,
    },
  });

  if (!examSubject) {
    throw new Error("Exam subject not found");
  }

  // Get students in the class
  const students = await prisma.student.findMany({
    where: {
      classId,
    },
    include: {
      class: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get existing results
  const existingResults = await prisma.examResult.findMany({
    where: {
      examSubjectId: examSubject.id,
      studentId: {
        in: students.map((s) => s.id),
      },
    },
  });

  const resultsMap = new Map<string, typeof existingResults[0]>(
    existingResults.map((r) => [r.studentId, r])
  );

  return {
    examSubject,
    students: students.map((student) => {
      const result = resultsMap.get(student.id);
      return {
        studentId: student.id,
        studentName: `${student.name} ${student.surname}`,
        username: student.username,
        marks: result ? result.marks : null,
        isAbsent: result !== undefined && result.marks === 0,
        grade: result ? result.grade : undefined,
      };
    }),
  };
}

/**
 * Save marks for students
 */
export async function saveStudentMarks(
  examId: number,
  examSubjectId: number,
  teacherId: string,
  marks: Array<{
    studentId: string;
    marks: number | null;
    isAbsent: boolean;
  }>
) {
  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
  });

  if (!examSubject) {
    throw new Error("Exam subject not found");
  }

  // Save marks in transaction
  const results = await prisma.$transaction(
    marks.map((entry) => {
      const grade = entry.isAbsent
        ? "AB"
        : calculateGrade(entry.marks!, examSubject.maxMarks);

      return prisma.examResult.upsert({
        where: {
          examSubjectId_studentId: {
            examSubjectId,
            studentId: entry.studentId,
          },
        },
        update: {
          marks: entry.isAbsent ? 0 : entry.marks!,
          grade,
        },
        create: {
          examId,
          examSubjectId,
          studentId: entry.studentId,
          marks: entry.isAbsent ? 0 : entry.marks!,
          grade,
        },
      });
    })
  );

  // Update marks entry status
  await prisma.examSubject.update({
    where: { id: examSubjectId },
    data: {
      marksEntered: true,
      marksEnteredAt: new Date(),
      marksEnteredBy: teacherId,
    },
  });

  return results;
}

// ==================== CLASS TEACHER: REPORT CARDS ====================

/**
 * Generate report cards for a class
 */
export async function generateClassReportCards(examId: number, classId: number) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examSubjects: {
        include: {
          subject: true,
          subjectResults: {
            where: {
              student: {
                classId,
              },
            },
            include: {
              student: true,
            },
          },
        },
      },
      grade: true,
      class: true,
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Get all students in class
  const students = await prisma.student.findMany({
    where: { classId },
    include: {
      class: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const reportCards: ReportCardData[] = [];

  for (const student of students) {
    const subjects: SubjectResult[] = [];
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let subjectCount = 0;

    for (const examSubject of exam.examSubjects) {
      const result = examSubject.subjectResults.find(
        (r) => r.studentId === student.id
      );

      const isAbsent = !result || result.marks === 0;
      const marks = result?.marks ?? null;
      const grade = result?.grade ?? (isAbsent ? "AB" : "-");

      subjects.push({
        subjectId: examSubject.subjectId,
        subjectName: examSubject.subject.name,
        marks,
        maxMarks: examSubject.maxMarks,
        grade,
        isAbsent,
      });

      if (!isAbsent && marks !== null) {
        totalMarks += marks;
        totalMaxMarks += examSubject.maxMarks;
        subjectCount++;
      }
    }

    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const average = subjectCount > 0 ? totalMarks / subjectCount : 0;
    const overallGrade = calculateGrade(percentage, 100);

    reportCards.push({
      studentId: student.id,
      studentName: `${student.name} ${student.surname}`,
      className: student.class.name,
      examTitle: exam.title,
      term: exam.term,
      year: exam.year,
      subjects,
      totalMarks,
      totalMaxMarks,
      percentage,
      average,
      overallGrade,
      classRank: 0, // Will be calculated after sorting
      classSize: students.length,
    });
  }

  // Calculate class ranks
  reportCards.sort((a, b) => b.totalMarks - a.totalMarks);
  reportCards.forEach((card, index) => {
    card.classRank = index + 1;
  });

  // Save exam summaries
  await prisma.$transaction(
    reportCards.map((card) =>
      prisma.examSummary.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: card.studentId,
          },
        },
        update: {
          totalMarks: card.totalMarks,
          totalMaxMarks: card.totalMaxMarks,
          percentage: card.percentage,
          average: card.average,
          overallGrade: card.overallGrade,
          classRank: card.classRank,
          classSize: card.classSize,
        },
        create: {
          examId,
          studentId: card.studentId,
          totalMarks: card.totalMarks,
          totalMaxMarks: card.totalMaxMarks,
          percentage: card.percentage,
          average: card.average,
          overallGrade: card.overallGrade,
          classRank: card.classRank,
          classSize: card.classSize,
        },
      })
    )
  );

  return reportCards;
}

/**
 * Get report card for a student
 */
export async function getStudentReportCard(examId: number, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examSubjects: {
        include: {
          subject: true,
          subjectResults: {
            where: {
              studentId,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  const summary = await prisma.examSummary.findUnique({
    where: {
      examId_studentId: {
        examId,
        studentId,
      },
    },
  });

  const subjects: SubjectResult[] = exam.examSubjects.map((examSubject) => {
    const result = examSubject.subjectResults[0];
    const isAbsent = !result || result.marks === 0;
    
    return {
      subjectId: examSubject.subjectId,
      subjectName: examSubject.subject.name,
      marks: result?.marks ?? null,
      maxMarks: examSubject.maxMarks,
      grade: result?.grade ?? (isAbsent ? "AB" : "-"),
      isAbsent,
    };
  });

  return {
    studentId,
    studentName: `${student.name} ${student.surname}`,
    className: student.class.name,
    examTitle: exam.title,
    term: exam.term,
    year: exam.year,
    subjects,
    totalMarks: summary?.totalMarks ?? 0,
    totalMaxMarks: summary?.totalMaxMarks ?? 0,
    percentage: summary?.percentage ?? 0,
    average: summary?.average ?? 0,
    overallGrade: summary?.overallGrade ?? "-",
    classRank: summary?.classRank ?? 0,
    classSize: summary?.classSize ?? 0,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate grade based on marks and max marks
 */
function calculateGrade(marks: number, maxMarks: number): string {
  const percentage = (marks / maxMarks) * 100;

  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 35) return "S";
  return "F";
}

/**
 * Get exams for a teacher (subjects they teach)
 */
export async function getTeacherExams(teacherId: string) {
  const examSubjects = await prisma.examSubject.findMany({
    where: {
      teacherId,
      exam: {
        status: ExamStatus.PUBLISHED,
      },
    },
    include: {
      exam: {
        include: {
          grade: true,
          class: true,
        },
      },
      subject: true,
    },
    orderBy: {
      exam: {
        createdAt: "desc",
      },
    },
  });

  return examSubjects;
}

/**
 * Get exams for a student
 */
export async function getStudentExams(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return await getPublishedExams({
    gradeId: student.gradeId,
    classId: student.classId,
  });
}

/**
 * Get exams for a parent (all children's exams)
 */
export async function getParentExams(parentId: string) {
  const children = await prisma.student.findMany({
    where: { parentId },
  });

  const childIds = children.map((c) => c.id);
  const gradeIdsSet = new Set(children.map((c) => c.gradeId));
  const gradeIds = Array.from(gradeIdsSet);

  const exams = await prisma.exam.findMany({
    where: {
      status: ExamStatus.PUBLISHED,
      gradeId: {
        in: gradeIds,
      },
    },
    include: {
      grade: true,
      class: true,
      examSubjects: {
        include: {
          subject: true,
        },
      },
      examSummaries: {
        where: {
          studentId: {
            in: childIds,
          },
        },
      },
    },
    orderBy: [{ year: "desc" }, { term: "desc" }],
  });

  return exams;
}
