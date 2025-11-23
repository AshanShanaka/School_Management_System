/**
 * COMPREHENSIVE FIX FOR PREDICTION SYSTEM
 * This file consolidates all fixes and ensures proper data flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkMLApiHealth } from '@/lib/mlPredictionService';
import prisma from '@/lib/prisma';

// Import the ML prediction service
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://127.0.0.1:5000';

/**
 * Build prediction features for a single student
 */
async function buildStudentFeatures(studentId: string) {
  try {
    // Get student with all necessary relations
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        grade: true,
        class: true,
        examResults: {
          include: {
            examSubject: {
              include: {
                subject: true,
                exam: true
              }
            }
          },
          where: {
            marks: { not: null }
          }
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!student) {
      console.error('[buildStudentFeatures] Student not found:', studentId);
      return null;
    }

    console.log('[buildStudentFeatures] Found student:', {
      name: `${student.name} ${student.surname}`,
      examResults: student.examResults.length,
      attendances: student.attendances.length
    });

    // Group marks by subject
    const subjectMarksMap = new Map<number, { name: string; marks: number[] }>();
    
    student.examResults.forEach((result) => {
      const subjectId = result.examSubject.subjectId;
      const subjectName = result.examSubject.subject.name;
      
      if (!subjectMarksMap.has(subjectId)) {
        subjectMarksMap.set(subjectId, {
          name: subjectName,
          marks: []
        });
      }
      
      subjectMarksMap.get(subjectId)!.marks.push(result.marks);
    });

    // Calculate attendance
    const presentCount = student.attendances.filter(a => a.present).length;
    const attendancePercentage = student.attendances.length > 0 
      ? (presentCount / student.attendances.length) * 100 
      : 0;

    // Format subjects for ML API
    const subjects = Array.from(subjectMarksMap.values()).map(subject => ({
      name: subject.name,
      marks: subject.marks
    }));

    console.log('[buildStudentFeatures] Prepared data:', {
      subjects: subjects.length,
      attendance: attendancePercentage.toFixed(1)
    });

    return {
      subjects,
      attendance: attendancePercentage
    };
  } catch (error) {
    console.error('[buildStudentFeatures] Error:', error);
    return null;
  }
}

/**
 * Call ML API with student features
 */
async function callMLAPI(subjects: Array<{name: string; marks: number[]}>, attendance: number) {
  try {
    console.log('[callMLAPI] Calling ML API with:', {
      subjects: subjects.length,
      attendance: attendance
    });

    const response = await fetch(`${ML_API_URL}/api/predict/student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subjects,
        attendance
      }),
    });

    if (!response.ok) {
      console.error('[callMLAPI] ML API returned error:', response.status);
      return null;
    }

    const result = await response.json();
    console.log('[callMLAPI] ML API response:', {
      success: result.success,
      hasData: !!result.data,
      subjects: result.data?.subject_predictions?.length
    });

    return result;
  } catch (error) {
    console.error('[callMLAPI] Error calling ML API:', error);
    return null;
  }
}

/**
 * FIXED Student Prediction API
 */
export async function GET(request: NextRequest) {
  try {
    console.log('\n=== STUDENT PREDICTION API REQUEST ===');
    
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      console.error('[API] No user authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API] User authenticated:', {
      id: user.id,
      role: user.role,
      username: user.username
    });

    // 2. Check role
    if (user.role !== 'student') {
      console.error('[API] User is not a student');
      return NextResponse.json({ error: 'Forbidden: Students only' }, { status: 403 });
    }

    // 3. Check ML API health
    console.log('[API] Checking ML API health...');
    const mlApiAvailable = await checkMLApiHealth();
    
    if (!mlApiAvailable) {
      console.error('[API] ML API is offline');
      return NextResponse.json({
        error: 'Prediction service is currently unavailable',
        mlApiStatus: 'offline'
      }, { status: 503 });
    }

    console.log('[API] ML API is online ✓');

    // 4. Build features
    console.log('[API] Building prediction features...');
    const features = await buildStudentFeatures(user.id);
    
    if (!features || features.subjects.length === 0) {
      console.error('[API] No features available');
      return NextResponse.json({
        error: 'No exam data available for predictions',
        message: 'Please ensure you have at least 3-5 exam results per subject'
      }, { status: 404 });
    }

    console.log('[API] Features built successfully ✓');

    // 5. Call ML API
    console.log('[API] Calling ML API...');
    const prediction = await callMLAPI(features.subjects, features.attendance);
    
    if (!prediction || !prediction.success) {
      console.error('[API] ML API call failed');
      return NextResponse.json({
        error: 'Failed to generate predictions',
        message: 'ML service returned an error'
      }, { status: 500 });
    }

    console.log('[API] Prediction generated successfully ✓');
    console.log('[API] Returning data:', {
      subjects: prediction.data.subject_predictions?.length,
      overall_average: prediction.data.overall_average,
      pass_probability: prediction.data.pass_probability,
      attendance: prediction.data.attendance_percentage
    });

    // 6. Return response
    return NextResponse.json({
      success: true,
      mlApiStatus: 'online',
      data: prediction.data
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
