/**
 * API Route: Class O/L Predictions
 * GET predictions for all students in a class
 * Accessible by: Class Teacher (own class), Admin (any class)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getClassPredictions } from '@/lib/predictionIntegrationService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classId = parseInt(params.classId);

    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    // Authorization check
    if (user.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { assignedClassId: true },
      });

      if (!teacher || teacher.assignedClassId !== classId) {
        return NextResponse.json({
          error: 'Forbidden: You can only view predictions for your assigned class'
        }, { status: 403 });
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();
    
    console.log(`ML API Health Check: ${mlApiAvailable ? 'ONLINE' : 'OFFLINE'}`);
    
    if (!mlApiAvailable) {
      return NextResponse.json({
        error: 'Prediction service is currently unavailable',
        mlApiStatus: 'offline'
      }, { status: 503 });
    }

    // Get predictions for the class
    console.log(`Fetching predictions for class ID: ${classId}`);
    const predictions = await getClassPredictions(classId);

    console.log(`Predictions result:`, predictions ? 'SUCCESS' : 'NULL');
    
    if (!predictions) {
      console.error(`Failed to generate predictions for class ${classId}`);
      return NextResponse.json({
        error: 'Unable to generate predictions for this class',
        message: 'Ensure students have sufficient exam history and attendance data.'
      }, { status: 404 });
    }

    console.log(`Successfully generated predictions for ${predictions.student_predictions?.length || 0} students`);

    return NextResponse.json({
      success: true,
      mlApiStatus: 'online',
      data: predictions
    });

  } catch (error) {
    console.error('Error fetching class predictions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
