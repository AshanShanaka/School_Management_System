/**
 * API Route: Student O/L Prediction
 * GET endpoint for authenticated students to view their own O/L predictions
 * Uses the SAME working method as class teacher predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getLatestPrediction } from '@/lib/predictionIntegrationService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';

export async function GET(request: NextRequest) {
  console.log('[Student API] ========== Student Prediction Request ==========');
  
  try {
    // Step 1: Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
      console.log('[Student API] ❌ No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Student API] ✅ User:', user.id, user.role);

    // Step 2: Verify user is a student
    if (user.role !== 'student') {
      console.log('[Student API] ❌ Not a student:', user.role);
      return NextResponse.json({ 
        error: 'Forbidden: Only students can access this endpoint' 
      }, { status: 403 });
    }

    // Step 3: Check ML API health
    const mlHealthy = await checkMLApiHealth();
    console.log('[Student API] ML API health:', mlHealthy ? 'ONLINE' : 'OFFLINE');
    
    if (!mlHealthy) {
      return NextResponse.json({
        error: 'Prediction service is currently unavailable',
        mlApiStatus: 'offline'
      }, { status: 503 });
    }

    // Step 4: Get predictions using the SAME method as class teacher
    console.log('[Student API] Calling getLatestPrediction...');
    const predictions = await getLatestPrediction(user.id);

    if (!predictions) {
      console.log('[Student API] ❌ No predictions returned');
      return NextResponse.json({
        error: 'Insufficient data for predictions',
        message: 'You need exam results and attendance records to generate predictions.'
      }, { status: 404 });
    }

    console.log('[Student API] ✅ Predictions received:', {
      subjects: predictions.subject_predictions?.length || 0,
      average: predictions.overall_average
    });

    return NextResponse.json({
      success: true,
      mlApiStatus: 'online',
      data: predictions
    });

  } catch (error) {
    console.error('[Student API] ❌ ERROR:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
