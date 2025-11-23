/**
 * API Route: Individual Meeting Management
 * GET - Get meeting details
 * PATCH - Update meeting (status, notes, etc.)
 * DELETE - Cancel/delete meeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await prisma.parentMeeting.findUnique({
      where: { id: params.id },
      include: {
        teacher: { select: { name: true, surname: true, email: true, phone: true } },
        parent: { select: { name: true, surname: true, email: true, phone: true } },
        student: { select: { name: true, surname: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check access
    if (
      user.role === 'teacher' && meeting.teacherId !== user.id ||
      user.role === 'parent' && meeting.parentId !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await prisma.parentMeeting.findUnique({
      where: { id: params.id },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check access
    if (
      user.role === 'teacher' && meeting.teacherId !== user.id ||
      user.role === 'parent' && meeting.parentId !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      scheduledDate,
      duration,
      location,
      meetingType,
      status,
      notes,
    } = body;

    const updatedMeeting = await prisma.parentMeeting.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
        ...(duration && { duration }),
        ...(location !== undefined && { location }),
        ...(meetingType && { meetingType }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        teacher: { select: { name: true, surname: true } },
        parent: { select: { name: true, surname: true } },
        student: { select: { name: true, surname: true } },
      },
    });

    return NextResponse.json({ success: true, meeting: updatedMeeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await prisma.parentMeeting.findUnique({
      where: { id: params.id },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Only teacher or the parent who created it can delete
    if (
      user.role === 'teacher' && meeting.teacherId !== user.id ||
      user.role === 'parent' && meeting.parentId !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.parentMeeting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
