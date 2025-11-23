import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  getParentChildrenInsights,
  getStudentPerformanceInsight,
} from '@/lib/performanceInsightService';

/**
 * GET /api/performance/my-insight
 * Returns performance insight for:
 * - Student: their own insight
 * - Parent: insights for all their children
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Student accessing their own insight
    if (user.role === 'student') {
      const student = await prisma.student.findUnique({
        where: { username: user.username },
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      const insight = await getStudentPerformanceInsight(student.id);

      if (!insight) {
        return NextResponse.json(
          {
            error: 'Not enough data',
            message:
              'Not enough exam results or attendance data to generate a prediction yet. Please check back after more assessments.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(insight);
    }

    // Parent accessing their children's insights
    if (user.role === 'parent') {
      const parent = await prisma.parent.findUnique({
        where: { username: user.username },
      });

      if (!parent) {
        return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
      }

      const insights = await getParentChildrenInsights(parent.id);

      if (insights.length === 0) {
        return NextResponse.json(
          {
            error: 'Not enough data',
            message:
              'Not enough exam results or attendance data to generate predictions for your children yet.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(insights);
    }

    return NextResponse.json(
      { error: 'Invalid role for this endpoint' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error in /api/performance/my-insight:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          'Failed to generate performance insight. Please try again later.',
      },
      { status: 500 }
    );
  }
}
