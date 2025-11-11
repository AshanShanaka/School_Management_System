// API Route: /api/timetable/teacher/[id] (GET)
// Get teacher's timetable view
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: teacherId } = params;

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        surname: true,
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignedClass: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get all active timetable slots for this teacher
    const slots = await prisma.timetableSlot.findMany({
      where: {
        teacherId,
        timetable: {
          isActive: true,
        },
      },
      include: {
        subject: true,
        timetable: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
      orderBy: [{ day: "asc" }, { period: "asc" }],
    });

    // Group slots by class
    const classTimetables = new Map();
    
    slots.forEach((slot) => {
      const classId = slot.timetable.classId;
      if (!classTimetables.has(classId)) {
        classTimetables.set(classId, {
          classId,
          className: slot.timetable.class.name,
          gradeLevel: slot.timetable.class.grade.level,
          timetableId: slot.timetable.id,
          academicYear: slot.timetable.academicYear,
          isClassTeacher: teacher.assignedClass?.id === classId,
          slots: [],
        });
      }
      classTimetables.get(classId).slots.push({
        id: slot.id,
        day: slot.day,
        period: slot.period,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        roomNumber: slot.roomNumber,
      });
    });

    // Convert to array
    const timetables = Array.from(classTimetables.values());

    // Create "My Week" view - all periods where teacher teaches
    const weekView: any[] = [];
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    
    days.forEach((day) => {
      const daySlots = slots.filter((slot) => slot.day === day);
      if (daySlots.length > 0) {
        weekView.push({
          day,
          slots: daySlots.map((slot) => ({
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject?.name,
            class: slot.timetable.class.name,
            gradeLevel: slot.timetable.class.grade.level,
            roomNumber: slot.roomNumber,
          })),
        });
      }
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        surname: teacher.surname,
        subjects: teacher.subjects,
        isClassTeacher: !!teacher.assignedClass,
        assignedClass: teacher.assignedClass,
      },
      timetables,
      weekView,
      totalPeriods: slots.length,
    });
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher timetable" },
      { status: 500 }
    );
  }
}
