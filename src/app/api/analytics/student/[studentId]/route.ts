/**
 * API Route: Get student analytics
 * Accessible by: Student (own data), Parent (child's data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStudentAnalytics } from '@/lib/performanceAnalyticsService';
import { checkMLApiHealth } from '@/lib/mlPredictionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = params;

    // Authorization check
    if (user.role === 'student') {
      // Students can only view their own data
      if (user.id !== studentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'parent') {
      // Parents can only view their children's data
      const { default: prisma } = await import('@/lib/prisma');
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { parentId: true },
      });

      if (!student || student.parentId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Only students and parents can access this endpoint
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check ML API health
    const mlApiAvailable = await checkMLApiHealth();

    // Get analytics
    const analytics = await getStudentAnalytics(studentId);

    if (!analytics) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mlApiStatus: mlApiAvailable ? 'online' : 'offline',
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
