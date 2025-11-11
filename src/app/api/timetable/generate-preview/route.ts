import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// School timetable configuration
const SCHOOL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const PERIODS = [
  { period: 1, startTime: '07:30', endTime: '08:15' },
  { period: 2, startTime: '08:15', endTime: '09:00' },
  { period: 3, startTime: '09:00', endTime: '09:45' },
  { period: 4, startTime: '09:45', endTime: '10:20' },
  // 20-minute break from 10:20 to 10:40
  { period: 5, startTime: '10:40', endTime: '11:25' },
  { period: 6, startTime: '11:25', endTime: '12:10' },
  { period: 7, startTime: '12:10', endTime: '12:55' },
  { period: 8, startTime: '12:55', endTime: '13:40' },
];

/**
 * POST /api/timetable/generate-preview
 * Generate a preview timetable WITHOUT saving to database
 * This allows users to review and edit before committing
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        grade: true,
      },
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Get all subjects with their teachers
    const subjects = await prisma.subject.findMany({
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    });

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: 'No subjects available. Please add subjects first.' },
        { status: 400 }
      );
    }

    // Generate slots preview (same algorithm as auto-schedule but NO DB save)
    const slots: any[] = [];
    const teacherSchedule = new Map<string, Set<string>>();
    
    // Calculate total periods needed per subject
    const totalPeriodsPerWeek = SCHOOL_DAYS.length * PERIODS.length; // 40 periods
    const periodsPerSubject = Math.floor(totalPeriodsPerWeek / subjects.length);
    
    // Create a pool of subject-period assignments
    const subjectPool: any[] = [];
    subjects.forEach(subject => {
      const teacherCount = subject.teachers.length;
      const teacher = teacherCount > 0 
        ? subject.teachers[Math.floor(Math.random() * teacherCount)]
        : null;
      
      for (let i = 0; i < periodsPerSubject; i++) {
        subjectPool.push({
          subject,
          teacher,
        });
      }
    });

    // Fill remaining slots with random subjects
    while (subjectPool.length < totalPeriodsPerWeek) {
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      const teacherCount = randomSubject.teachers.length;
      const teacher = teacherCount > 0
        ? randomSubject.teachers[Math.floor(Math.random() * teacherCount)]
        : null;
      
      subjectPool.push({
        subject: randomSubject,
        teacher,
      });
    }

    // Shuffle the pool
    for (let i = subjectPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [subjectPool[i], subjectPool[j]] = [subjectPool[j], subjectPool[i]];
    }

    // Assign to time slots
    let poolIndex = 0;
    for (const day of SCHOOL_DAYS) {
      for (const periodInfo of PERIODS) {
        if (poolIndex >= subjectPool.length) break;

        const { subject, teacher } = subjectPool[poolIndex];
        const slotKey = `${day}-P${periodInfo.period}`;
        
        // Check teacher availability
        if (teacher) {
          if (!teacherSchedule.has(teacher.id)) {
            teacherSchedule.set(teacher.id, new Set());
          }
          
          const teacherSlots = teacherSchedule.get(teacher.id)!;
          
          // Simple conflict check
          if (!teacherSlots.has(slotKey)) {
            teacherSlots.add(slotKey);
            
            slots.push({
              day,
              period: periodInfo.period,
              startTime: periodInfo.startTime,
              endTime: periodInfo.endTime,
              slotType: 'REGULAR',
              subjectId: subject.id,
              subject: {
                id: subject.id,
                name: subject.name,
              },
              teacherId: teacher.id,
              teacher: {
                id: teacher.id,
                name: teacher.name,
                surname: teacher.surname,
              },
              roomNumber: null,
              notes: null,
              isBreak: false,
            });
            
            poolIndex++;
          }
        } else {
          // Subject has no teacher assigned
          slots.push({
            day,
            period: periodInfo.period,
            startTime: periodInfo.startTime,
            endTime: periodInfo.endTime,
            slotType: 'REGULAR',
            subjectId: subject.id,
            subject: {
              id: subject.id,
              name: subject.name,
            },
            teacherId: null,
            teacher: null,
            roomNumber: null,
            notes: 'No teacher assigned',
            isBreak: false,
          });
          
          poolIndex++;
        }
      }
    }

    const stats = {
      totalSlots: slots.length,
      subjectsScheduled: new Set(slots.map(s => s.subjectId)).size,
      teachersInvolved: new Set(slots.filter(s => s.teacherId).map(s => s.teacherId)).size,
      daysScheduled: SCHOOL_DAYS.length,
    };

    // Return preview data ONLY (no database write)
    return NextResponse.json({
      success: true,
      message: 'Timetable preview generated. Review and click Save to persist.',
      timetable: {
        class: classRecord,
      },
      slots,
      stats,
    });

  } catch (error: any) {
    console.error('Error generating timetable preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate timetable preview' },
      { status: 500 }
    );
  }
}
