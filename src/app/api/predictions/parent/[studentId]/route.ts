/**
 * API Route: Parent's Child O/L Prediction
 * GET prediction for parent's child
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getLatestPrediction } from '@/lib/predictionIntegrationService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only parents can access this endpoint
    if (user.role !== 'parent') {
      return NextResponse.json({ error: 'Forbidden: Parents only' }, { status: 403 });
    }

    const { studentId } = params;

    // Verify the student is the parent's child
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { parentId: true },
    });

    if (!student || student.parentId !== user.id) {
      return NextResponse.json({
        error: 'Forbidden: You can only view predictions for your own children'
      }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();
    
    if (!mlApiAvailable) {
      return NextResponse.json({
        error: 'Prediction service is currently unavailable',
        mlApiStatus: 'offline'
      }, { status: 503 });
    }

    // Get prediction
    const prediction = await getLatestPrediction(studentId);

    if (!prediction) {
      return NextResponse.json({
        error: 'Unable to generate prediction',
        message: 'At least 3-5 exam results are required for accurate predictions.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mlApiStatus: 'online',
      data: prediction
    });

  } catch (error) {
    console.error('Error fetching parent child prediction:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
