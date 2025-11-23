/**
 * API Route: Admin School-wide O/L Analytics
 * GET predictions for all classes (bulk)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { predictBulk } from '@/lib/mlPredictionService';
import { buildClassPredictionFeatures } from '@/lib/predictionIntegrationService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access this endpoint
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();
    
    if (!mlApiAvailable) {
      return NextResponse.json({
        error: 'Prediction service is currently unavailable',
        mlApiStatus: 'offline'
      }, { status: 503 });
    }

    // Get all Grade 11 classes (O/L relevant)
    const classes = await prisma.class.findMany({
      where: {
        grade: {
          level: { in: [11] }
        }
      },
      select: {
        id: true,
        name: true,
        gradeId: true,
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
      },
    });

    // Build analytics for each class
    const classesAnalytics = await Promise.all(
      classes.map(async (classItem) => {
        const students = await buildClassPredictionFeatures(classItem.id);
        
        if (students.length === 0) {
          return null;
        }

        // Calculate class-level metrics
        const totalStudents = students.length;
        const predictions = await predictBulk([{
          class_id: classItem.id.toString(),
          class_name: classItem.name,
          students: students
        }]);

        if (!predictions || !predictions[classItem.id.toString()]) {
          return null;
        }

        const classPrediction = predictions[classItem.id.toString()];
        const avgPrediction = classPrediction.class_average_prediction || 0;
        const passRate = classPrediction.class_pass_rate || 0;
        
        // Determine risk level
        let riskLevel = 'LOW';
        if (passRate < 60) {
          riskLevel = 'HIGH';
        } else if (passRate < 75) {
          riskLevel = 'MEDIUM';
        }

        return {
          classId: classItem.id,
          className: classItem.name,
          grade: classItem.grade.level,
          studentCount: totalStudents,
          averagePrediction: avgPrediction,
          passRate: passRate,
          riskLevel: riskLevel
        };
      })
    );

    // Filter out null results (classes with no data)
    const validClasses = classesAnalytics.filter((c) => c !== null);

    if (validClasses.length === 0) {
      return NextResponse.json({
        error: 'No prediction data available',
        message: 'Ensure students have sufficient exam history.'
      }, { status: 404 });
    }

    return NextResponse.json(validClasses);

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
