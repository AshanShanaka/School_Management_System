/**
 * API Route: Teacher Subject-based O/L Predictions
 * GET predictions for subjects the teacher teaches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { buildClassPredictionFeatures } from '@/lib/predictionIntegrationService';
import { checkMLApiHealth, predictBulk } from '@/lib/mlPredictionService';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can access this endpoint
    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Teachers only' }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();
    
    if (!mlApiAvailable) {
      return NextResponse.json({
        error: 'Prediction service is currently unavailable',
        mlApiStatus: 'offline'
      }, { status: 503 });
    }

    // Get all lessons (subjects) this teacher teaches
    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: user.id
      },
      select: {
        subjectId: true,
        classId: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                level: true
              }
            },
            students: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (lessons.length === 0) {
      return NextResponse.json([]);
    }

    // Build predictions for each class the teacher teaches
    const subjectPredictions = await Promise.all(
      lessons.map(async (lesson) => {
        const students = await buildClassPredictionFeatures(lesson.classId);
        
        if (students.length === 0) {
          return null;
        }

        // Get predictions for this class
        const predictions = await predictBulk([{
          class_id: lesson.classId.toString(),
          class_name: lesson.class.name,
          students: students
        }]);

        if (!predictions || !predictions[lesson.classId.toString()]) {
          return null;
        }

        const classPrediction = predictions[lesson.classId.toString()];
        
        // Find subject-specific data from student predictions
        const subjectData = classPrediction.students?.map((student: any) => {
          const subjectPred = student.subject_predictions?.find(
            (sp: any) => sp.subject_id === lesson.subjectId
          );
          return subjectPred;
        }).filter(Boolean) || [];

        const averageMarks = subjectData.length > 0
          ? subjectData.reduce((sum: number, sp: any) => sum + (sp.current_average || 0), 0) / subjectData.length
          : 0;

        const predictedAvg = subjectData.length > 0
          ? subjectData.reduce((sum: number, sp: any) => sum + (sp.predicted_marks || 0), 0) / subjectData.length
          : 0;

        const passCount = subjectData.filter((sp: any) => sp.predicted_grade && sp.predicted_grade !== 'W').length;
        const passRate = subjectData.length > 0 ? (passCount / subjectData.length) * 100 : 0;

        const atRiskStudents = subjectData.filter(
          (sp: any) => sp.predicted_marks < 40 || sp.predicted_grade === 'W'
        ).length;

        return {
          subjectId: lesson.subject.id,
          subjectName: lesson.subject.name,
          classId: lesson.class.id,
          className: lesson.class.name,
          grade: lesson.class.grade.level,
          studentCount: students.length,
          averageMarks: averageMarks,
          predictedAverage: predictedAvg,
          passRate: passRate,
          atRiskStudents: atRiskStudents
        };
      })
    );

    // Filter out null results
    const validPredictions = subjectPredictions.filter((p) => p !== null);

    return NextResponse.json(validPredictions);

  } catch (error) {
    console.error('Error fetching teacher predictions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
