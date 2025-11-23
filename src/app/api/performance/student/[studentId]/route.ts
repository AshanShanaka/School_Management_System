import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getStudentPerformanceInsight } from '@/lib/performanceInsightService';

/**
 * GET /api/performance/student/[studentId]
 * Returns full performance insight for a specific student
 * Access: Class teacher (only their class students), Admin, or the student themselves
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = params.studentId;

    // Fetch student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check authorization
    if (user.role === 'student') {
      // Student can only view their own data
      if (user.username !== student.username) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view your own data' },
          { status: 403 }
        );
      }
    } else if (user.role === 'teacher') {
      // Teacher must be the class teacher for this student's class
      const teacher = await prisma.teacher.findUnique({
        where: { username: user.username },
        include: { assignedClass: true },
      });

      if (!teacher || !teacher.assignedClass) {
        return NextResponse.json(
          { error: 'Teacher not found or not assigned to a class' },
          { status: 404 }
        );
      }

      if (teacher.assignedClass.id !== student.classId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view students from your assigned class' },
          { status: 403 }
        );
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get full insight
    const insight = await getStudentPerformanceInsight(studentId);

    if (!insight) {
      return NextResponse.json(
        {
          error: 'Not enough data',
          message:
            'Not enough exam results or attendance data to generate a prediction yet.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(insight);
  } catch (error) {
    console.error('Error in /api/performance/student/:studentId:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate student insight. Please try again later.',
      },
      { status: 500 }
    );
  }
}
