/**
 * Prediction Integration Service
 * Fetches data from database and integrates with ML prediction service
 */

import prisma from '@/lib/prisma';
import { predictStudent, predictClass, SubjectPrediction } from './mlPredictionService';
import { OLGrade } from '@/types/performance';

export interface MLPredictionInput {
  subjects: {
    name: string;
    marks: number[];
  }[];
  attendance: number;
}

export interface MLPredictionResponse {
  predictedGrades: Record<string, OLGrade>;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  probabilityPassAll: number;
  mainFactors: string[];
  subjectPredictions: {
    subject: string;
    predictedMark: number;
    predictedGrade: OLGrade;
    currentAverage: number;
  }[];
  attendanceRate: number;
  adjustmentFactor: number;
}

/**
 * Build features for student prediction from database
 * Fetches exam history and attendance data for a student
 */
export async function buildPredictionFeatures(
  studentId: string
): Promise<MLPredictionInput | null> {
  try {
    // Fetch student's exam results organized by subject
    const examResults = await prisma.examResult.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            createdAt: true,
            term: true,
            year: true,
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
          createdAt: 'asc',
        },
      },
    });

    // Group marks by subject
    const subjectMarksMap = new Map<number, { name: string; marks: number[] }>();

    for (const result of examResults) {
      const subjectId = result.examSubject.subject.id;
      const subjectName = result.examSubject.subject.name;

      if (!subjectMarksMap.has(subjectId)) {
        subjectMarksMap.set(subjectId, { name: subjectName, marks: [] });
      }

      // ExamResult uses 'marks' field
      subjectMarksMap.get(subjectId)!.marks.push(result.marks);
    }

    // Calculate attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: thirtyDaysAgo },
      },
    });

    let attendanceRate = 100; // Default to 100%

    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(
        (record) => record.status === 'PRESENT'
      ).length;
      attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100);
    }

    // Convert to ML input format
    const subjects = Array.from(subjectMarksMap.values()).map((subject) => ({
      name: subject.name,
      marks: subject.marks,
    }));

    if (subjects.length === 0) {
      return null; // No exam data available
    }

    return {
      subjects,
      attendance: attendanceRate,
    };
  } catch (error) {
    console.error('Error building prediction features:', error);
    return null;
  }
}

/**
 * Build prediction features for entire class
 * Optimized to fetch all data in fewer queries
 */
export async function buildClassPredictionFeatures(classId: number) {
  try {
    // Fetch all students in the class with their exam results and attendance in ONE query
    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        name: true,
        surname: true,
        examResults: {
          include: {
            exam: {
              select: {
                createdAt: true,
                term: true,
                year: true,
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
        },
        attendances: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          select: {
            present: true,
          },
        },
      },
    });

    console.log(`Processing ${students.length} students for class ${classId}`);

    const studentFeatures = students.map((student) => {
      // Sort exam results by date
      const sortedResults = student.examResults.sort((a, b) => {
        const dateA = a.exam?.createdAt ? new Date(a.exam.createdAt).getTime() : 0;
        const dateB = b.exam?.createdAt ? new Date(b.exam.createdAt).getTime() : 0;
        return dateA - dateB;
      });

      // Process exam results into subject marks
      const subjectMarksMap = new Map<number, { name: string; marks: number[] }>();

      for (const result of sortedResults) {
        const subjectId = result.examSubject.subject.id;
        const subjectName = result.examSubject.subject.name;

        if (!subjectMarksMap.has(subjectId)) {
          subjectMarksMap.set(subjectId, { name: subjectName, marks: [] });
        }

        subjectMarksMap.get(subjectId)!.marks.push(result.marks);
      }

      // Calculate attendance
      let attendanceRate = 80; // Default
      if (student.attendances.length > 0) {
        const presentCount = student.attendances.filter((a) => a.present).length;
        attendanceRate = Math.round((presentCount / student.attendances.length) * 100);
      }

      // Convert to required format
      const subjects = Array.from(subjectMarksMap.values()).map((subject) => ({
        name: subject.name,
        marks: subject.marks,
      }));

      // Only include students with exam data
      if (subjects.length === 0) {
        console.log(`Skipping student ${student.name} - no exam data`);
        return null;
      }

      return {
        student_id: student.id,
        name: `${student.name} ${student.surname}`,
        subjects,
        attendance: attendanceRate,
      };
    });

    // Filter out students without data
    const validFeatures = studentFeatures.filter((f) => f !== null);
    console.log(`${validFeatures.length} students have valid data for predictions`);
    
    return validFeatures;
  } catch (error) {
    console.error('Error building class prediction features:', error);
    return [];
  }
}

/**
 * Build prediction features for a specific subject across multiple students
 */
export async function buildSubjectPredictionFeatures(
  subjectId: number,
  studentIds: string[]
) {
  try {
    const studentFeatures = await Promise.all(
      studentIds.map(async (studentId) => {
        // Fetch student info
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { name: true, surname: true },
        });

        if (!student) return null;

        // Fetch marks for this subject
        const examResults = await prisma.examResult.findMany({
          where: {
            studentId,
            examSubject: {
              subjectId,
            },
          },
          include: {
            exam: {
              select: { createdAt: true, term: true, year: true },
            },
          },
        });

        // Sort results by exam createdAt manually
        const sortedResults = examResults.sort((a, b) => {
          const dateA = a.exam?.createdAt ? new Date(a.exam.createdAt).getTime() : 0;
          const dateB = b.exam?.createdAt ? new Date(b.exam.createdAt).getTime() : 0;
          return dateA - dateB;
        });

        const marks = sortedResults.map((result) => result.marks);

        if (marks.length === 0) return null;

        // Calculate attendance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId,
            date: { gte: thirtyDaysAgo },
          },
        });

        let attendanceRate = 100;

        if (attendanceRecords.length > 0) {
          const presentCount = attendanceRecords.filter(
            (record) => record.status === 'PRESENT'
          ).length;
          attendanceRate = Math.round(
            (presentCount / attendanceRecords.length) * 100
          );
        }

        return {
          student_id: studentId,
          name: `${student.name} ${student.surname}`,
          marks,
          attendance: attendanceRate,
        };
      })
    );

    return studentFeatures.filter((f) => f !== null);
  } catch (error) {
    console.error('Error building subject prediction features:', error);
    return [];
  }
}

/**
 * Call the ML prediction API for a student
 * @param features - Input features for prediction
 * @returns Prediction response or null on error
 */
export async function callPredictionAPI(
  features: MLPredictionInput
): Promise<MLPredictionResponse | null> {
  try {
    const response = await predictStudent(features.subjects, features.attendance);

    if (!response || !response.success) {
      return null;
    }

    const data = response.data;

    // Convert to expected format
    const predictedGrades: Record<string, OLGrade> = {};
    data.subject_predictions.forEach((pred) => {
      predictedGrades[pred.subject] = pred.predicted_grade;
    });

    return {
      predictedGrades,
      overallRisk: data.risk_level,
      probabilityPassAll: data.pass_probability,
      mainFactors: data.recommendations,
      subjectPredictions: data.subject_predictions.map((pred) => ({
        subject: pred.subject,
        predictedMark: pred.predicted_mark,
        predictedGrade: pred.predicted_grade,
        currentAverage: pred.current_average,
      })),
      attendanceRate: data.attendance_percentage,
      adjustmentFactor: 1.0,
    };
  } catch (error) {
    console.error('Error calling prediction API:', error);
    return null;
  }
}

/**
 * Get latest prediction for a student
 * Fetches data and calls ML API
 * Returns raw ML format suitable for student/parent views
 */
export async function getLatestPrediction(
  studentId: string
): Promise<any | null> {
  console.log(`[getLatestPrediction] Starting for student: ${studentId}`);
  
  const features = await buildPredictionFeatures(studentId);

  if (!features) {
    console.error(`[getLatestPrediction] No features built for student ${studentId}`);
    return null;
  }

  console.log(`[getLatestPrediction] Features built:`, {
    subjects: features.subjects.length,
    attendance: features.attendance
  });

  // Call ML API directly and return raw response
  const response = await predictStudent(features.subjects, features.attendance);
  
  if (!response || !response.success) {
    console.error(`[getLatestPrediction] ML API call failed`);
    return null;
  }

  console.log(`[getLatestPrediction] Success:`, {
    subjects: response.data.subject_predictions?.length || 0,
    average: response.data.overall_average
  });

  return response.data;
}

/**
 * Get predictions for all students in a class
 */
export async function getClassPredictions(classId: number) {
  console.log(`[getClassPredictions] Starting for class ID: ${classId}`);
  
  const studentFeatures = await buildClassPredictionFeatures(classId);

  console.log(`[getClassPredictions] Found ${studentFeatures.length} students with valid data`);

  if (studentFeatures.length === 0) {
    console.error(`[getClassPredictions] No students with exam data found for class ${classId}`);
    return null;
  }

  console.log(`[getClassPredictions] Calling ML API with ${studentFeatures.length} students...`);
  const result = await predictClass(studentFeatures);
  
  console.log(`[getClassPredictions] ML API result:`, result ? 'SUCCESS' : 'FAILED');
  
  return result;
}
