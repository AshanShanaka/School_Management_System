import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { timetableService } from "@/lib/modernTimetableService";

// GET /api/timetables/[classId] - Get class timetable
export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = parseInt(params.classId);

    // Get timetable data
    const timetableData = await timetableService.getClassTimetable(classId);

    return NextResponse.json(timetableData);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT /api/timetables/[classId] - Update class timetable
export async function PUT(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = parseInt(params.classId);
    const body = await request.json();
    const { slots } = body;

    // Begin transaction
    await prisma.$transaction(async (tx: any) => {
      // Ensure timetable exists
      let timetable = await tx.timetable.findFirst({
        where: { classId },
      });

      if (!timetable) {
        // Get class info to create timetable name
        const classData = await tx.class.findUnique({
          where: { id: classId },
          include: { grade: true }
        });

        timetable = await tx.timetable.create({
          data: {
            name: `Timetable for ${classData?.name || 'Class'}`,
            academicYear: new Date().getFullYear().toString(),
            classId: classId,
            isActive: true,
          },
        });
      }

      // Delete existing timetable slots
      await tx.timetableSlot.deleteMany({
        where: { timetableId: timetable.id },
      });

      // Create new timetable slots
      for (const slot of slots) {
        if (slot.subjectId && !slot.isBreak) {
          await tx.timetableSlot.create({
            data: {
              timetableId: timetable.id,
              day: slot.day,
              period: slot.period,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBreak: slot.isBreak || false,
              subjectId: slot.subjectId,
              teacherId: slot.teacherId,
            },
          });
        }
      }
    });

    // Return updated timetable
    const updatedTimetable = await timetableService.getClassTimetable(classId);
    return NextResponse.json(updatedTimetable);
  } catch (error) {
    console.error("Error updating timetable:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/timetables/[classId]/auto-schedule - Auto-schedule timetable
export async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = parseInt(params.classId);
    const body = await request.json();
    const options = body.options || {};

    // Auto-schedule the timetable
    const scheduledTimetable = await timetableService.autoScheduleTimetable(
      classId,
      options
    );

    return NextResponse.json(scheduledTimetable);
  } catch (error) {
    console.error("Error auto-scheduling timetable:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
