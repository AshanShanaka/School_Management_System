import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getClassInsights } from '@/lib/performanceInsightService';

/**
 * GET /api/performance/class/[classId]/insights
 * Returns simplified insights for all students in a class
 * Access: Class teacher (only their class) or Admin/Principal (any class)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classId = parseInt(params.classId);

    if (isNaN(classId)) {
      return NextResponse.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    // Check authorization
    if (user.role === 'teacher') {
      // Teacher must be the class teacher for this class
      const teacher = await prisma.teacher.findUnique({
        where: { username: user.username },
        include: { assignedClass: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher not found' },
          { status: 404 }
        );
      }

      if (!teacher.assignedClass || teacher.assignedClass.id !== classId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view your assigned class' },
          { status: 403 }
        );
      }
    } else if (user.role !== 'admin') {
      // Only admin and class teacher can access
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get insights for all students in class
    const insights = await getClassInsights(classId);

    if (insights.length === 0) {
      return NextResponse.json(
        {
          error: 'No data available',
          message:
            'No predictions available for students in this class yet. Students need sufficient exam results and attendance data.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error in /api/performance/class/:classId/insights:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate class insights. Please try again later.',
      },
      { status: 500 }
    );
  }
}
