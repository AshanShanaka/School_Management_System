/**
 * Performance Analytics Service
 * Aggregates student data and generates insights using ML predictions
 */

import prisma from './prisma';
import { getSubjectPredictions, SubjectPrediction, calculateRiskLevel, getRecommendations } from './mlPredictionService';

export interface StudentAnalytics {
  studentId: string;
  studentName: string;
  className: string;
  currentAverage: number;
  predictedAverage: number;
  overallRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  attendanceRate: number;
  totalExams: number;
  subjectPredictions: SubjectPrediction[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface ClassAnalyticsSummary {
  classId: number;
  className: string;
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageAttendance: number;
  classAverage: number;
  students: StudentAnalytics[];
}

/**
 * Calculate attendance rate for a student
 */
async function calculateAttendanceRate(studentId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId,
      date: { gte: thirtyDaysAgo },
    },
  });

  if (attendanceRecords.length === 0) return 100;

  const presentCount = attendanceRecords.filter(
    (record) => record.status === 'PRESENT'
  ).length;

  return Math.round((presentCount / attendanceRecords.length) * 100);
}

/**
 * Get student's exam history organized by subject
 */
async function getStudentExamHistory(studentId: string) {
  // Get all exam results for the student
  const examResults = await prisma.examResult.findMany({
    where: { studentId },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          year: true,
          term: true,
          startDate: true,
        },
      },
      examSubject: {
        select: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      exam: {
        startDate: 'asc',
      },
    },
  });

  // Organize by subject
  const subjectMarksMap = new Map<number, { name: string; marks: number[] }>();

  for (const result of examResults) {
    const subjectId = result.examSubject.subject.id;
    const subjectName = result.examSubject.subject.name;

    if (!subjectMarksMap.has(subjectId)) {
      subjectMarksMap.set(subjectId, { name: subjectName, marks: [] });
    }

    subjectMarksMap.get(subjectId)!.marks.push(result.marks);
  }

  return subjectMarksMap;
}

/**
 * Get analytics for a single student
 */
export async function getStudentAnalytics(studentId: string): Promise<StudentAnalytics | null> {
  // Fetch student with class info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) return null;

  // Get exam history organized by subject
  const subjectMarksMap = await getStudentExamHistory(studentId);

  // Calculate current average across all subjects
  let totalMarks = 0;
  let totalSubjects = 0;

  for (const data of Array.from(subjectMarksMap.values())) {
    if (data.marks.length > 0) {
      const avg = data.marks.reduce((a, b) => a + b, 0) / data.marks.length;
      totalMarks += avg;
      totalSubjects++;
    }
  }

  const currentAverage = totalSubjects > 0 ? Math.round(totalMarks / totalSubjects) : 0;

  // Calculate attendance rate
  const attendanceRate = await calculateAttendanceRate(studentId);

  // Get predictions for all subjects with attendance rate
  let subjectPredictions: SubjectPrediction[] = [];
  try {
    subjectPredictions = await getSubjectPredictions(subjectMarksMap, attendanceRate);
  } catch (error) {
    console.error('Failed to get subject predictions:', error);
  }

  // Calculate predicted average
  const predictedAverage =
    subjectPredictions.length > 0
      ? Math.round(
          subjectPredictions.reduce((sum, pred) => sum + pred.predicted_mark, 0) /
            subjectPredictions.length
        )
      : currentAverage;

  // Determine overall risk level
  const overallRiskLevel = calculateRiskLevel(predictedAverage);

  // Get total exam count
  const totalExams = await prisma.examResult.count({
    where: { studentId },
  });

  // Generate recommendations
  const trend = currentAverage < predictedAverage ? 'IMPROVING' : 
                currentAverage > predictedAverage ? 'DECLINING' : 'STABLE';
  const recommendations = getRecommendations(overallRiskLevel, trend);

  // Add attendance-specific recommendations
  if (attendanceRate < 75) {
    recommendations.unshift('⚠️ Low attendance detected - prioritize attendance improvement');
  }

  return {
    studentId,
    studentName: `${student.name} ${student.surname}`,
    className: student.class.name,
    currentAverage,
    predictedAverage,
    overallRiskLevel,
    attendanceRate,
    totalExams,
    subjectPredictions,
    recommendations,
    lastUpdated: new Date(),
  };
}

/**
 * Get analytics for all students in a class
 */
export async function getClassAnalytics(classId: number): Promise<ClassAnalyticsSummary | null> {
  // Fetch class with students
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      students: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!classData) return null;

  // Get analytics for each student
  const studentAnalyticsPromises = classData.students.map((student) =>
    getStudentAnalytics(student.id)
  );

  const studentAnalytics = (await Promise.all(studentAnalyticsPromises)).filter(
    (analytics): analytics is StudentAnalytics => analytics !== null
  );

  // Calculate summary statistics
  const totalStudents = studentAnalytics.length;
  const highRiskCount = studentAnalytics.filter((s) => s.overallRiskLevel === 'HIGH').length;
  const mediumRiskCount = studentAnalytics.filter((s) => s.overallRiskLevel === 'MEDIUM').length;
  const lowRiskCount = studentAnalytics.filter((s) => s.overallRiskLevel === 'LOW').length;

  const averageAttendance =
    totalStudents > 0
      ? Math.round(
          studentAnalytics.reduce((sum, s) => sum + s.attendanceRate, 0) / totalStudents
        )
      : 0;

  const classAverage =
    totalStudents > 0
      ? Math.round(
          studentAnalytics.reduce((sum, s) => sum + s.currentAverage, 0) / totalStudents
        )
      : 0;

  return {
    classId,
    className: classData.name,
    totalStudents,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    averageAttendance,
    classAverage,
    students: studentAnalytics,
  };
}

/**
 * Get analytics for a parent's child
 */
export async function getParentChildAnalytics(parentId: string): Promise<StudentAnalytics[]> {
  // Get all children of the parent
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      students: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!parent) return [];

  // Get analytics for each child
  const analyticsPromises = parent.students.map((student) =>
    getStudentAnalytics(student.id)
  );

  const analytics = await Promise.all(analyticsPromises);

  return analytics.filter((a): a is StudentAnalytics => a !== null);
}
