/**
 * API Route: Meetings Management
 * GET - List meetings (filtered by role)
 * POST - Create new meeting (teacher/parent)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('[Meetings API] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Meetings API] User:', user.id, 'Role:', user.role);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    let meetings;

    if (user.role === 'teacher') {
      // Class teacher sees meetings for their class
      meetings = await prisma.parentMeeting.findMany({
        where: {
          teacherId: user.id,
          ...(status && { status: status as any }),
          ...(studentId && { studentId }),
        },
        include: {
          parent: { select: { name: true, surname: true, email: true, phone: true } },
          student: { select: { name: true, surname: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      });
    } else if (user.role === 'parent') {
      // Parent sees their own meetings
      meetings = await prisma.parentMeeting.findMany({
        where: {
          parentId: user.id,
          ...(status && { status: status as any }),
          ...(studentId && { studentId }),
        },
        include: {
          teacher: { select: { name: true, surname: true, email: true, phone: true } },
          student: { select: { name: true, surname: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      });
    } else {
      console.error('[Meetings API] Invalid role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[Meetings API] Found meetings:', meetings.length);
    return NextResponse.json({ success: true, meetings });
  } catch (error) {
    console.error('[Meetings API] Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('[Meetings API POST] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Meetings API POST] User:', user.id, 'Role:', user.role);

    if (user.role !== 'teacher' && user.role !== 'parent') {
      console.error('[Meetings API POST] Invalid role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[Meetings API POST] Request body:', body);
    
    const {
      teacherId,
      parentId,
      studentId,
      title,
      description,
      scheduledDate,
      duration,
      location,
      meetingType,
    } = body;

    // Validation
    if (!teacherId || !parentId || !studentId || !title || !scheduledDate) {
      const missingFields = [];
      if (!teacherId) missingFields.push('teacherId');
      if (!parentId) missingFields.push('parentId');
      if (!studentId) missingFields.push('studentId');
      if (!title) missingFields.push('title');
      if (!scheduledDate) missingFields.push('scheduledDate');
      
      console.error('[Meetings API POST] Missing required fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    // If parent is creating, ensure they're creating for their own child
    if (user.role === 'parent' && parentId !== user.id) {
      console.error('[Meetings API POST] Parent trying to create for another parent');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get student's classId
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true },
    });

    if (!student) {
      console.error('[Meetings API POST] Student not found:', studentId);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    console.log('[Meetings API POST] Creating meeting...');

    // Create meeting
    const meeting = await prisma.parentMeeting.create({
      data: {
        teacherId,
        parentId,
        studentId,
        classId: student.classId,
        title,
        description: description || null,
        scheduledDate: new Date(scheduledDate),
        duration: duration || 30,
        location: location || null,
        meetingType: meetingType || 'IN_PERSON',
        status: 'SCHEDULED',
      },
      include: {
        teacher: { select: { name: true, surname: true } },
        parent: { select: { name: true, surname: true } },
        student: { select: { name: true, surname: true } },
      },
    });

    console.log('[Meetings API POST] Meeting created:', meeting.id);
    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error) {
    console.error('[Meetings API POST] Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
