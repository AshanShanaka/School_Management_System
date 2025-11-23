/**
 * API Route: Get class analytics
 * Accessible by: Class Teacher (own class only), Admin (any class)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getClassAnalytics } from '@/lib/performanceAnalyticsService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    // Get authenticated user
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
      // Check if teacher is assigned to this class
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { assignedClassId: true },
      });

      if (!teacher || teacher.assignedClassId !== classId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view analytics for your assigned class' },
          { status: 403 }
        );
      }
    } else if (user.role !== 'admin') {
      // Only admins and class teachers can access this endpoint
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();

    // Get analytics
    const analytics = await getClassAnalytics(classId);

    if (!analytics) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mlApiStatus: mlApiAvailable ? 'online' : 'offline',
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
