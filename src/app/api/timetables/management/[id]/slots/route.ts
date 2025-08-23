import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;

    if (role !== "admin" && role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timetableId = parseInt(params.id);
    const { slots } = await request.json();

    // Clear existing slots for this timetable
    await prisma.timetableSlot.deleteMany({
      where: { timetableId },
    });

    // Create new slots
    const slotPromises = slots.map(async (slot: any) => {
      if (slot.isBreak || !slot.lessonId) {
        return prisma.timetableSlot.create({
          data: {
            timetableId,
            day: slot.day,
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: slot.isBreak || false,
          },
        });
      } else {
        // Create lesson if it doesn't exist
        let lesson = await prisma.lesson.findFirst({
          where: {
            subjectId: slot.lessonId,
            day: slot.day,
            startTime: new Date(`1970-01-01T${slot.startTime}:00`),
            endTime: new Date(`1970-01-01T${slot.endTime}:00`),
          },
        });

        if (!lesson) {
          // Get the first teacher for this subject
          const subject = await prisma.subject.findUnique({
            where: { id: slot.lessonId },
            include: { teachers: true },
          });

          if (!subject || subject.teachers.length === 0) {
            throw new Error(`No teachers found for subject ${slot.lessonId}`);
          }

          lesson = await prisma.lesson.create({
            data: {
              name: `${subject.name} Lesson`,
              day: slot.day,
              startTime: new Date(`1970-01-01T${slot.startTime}:00`),
              endTime: new Date(`1970-01-01T${slot.endTime}:00`),
              subjectId: slot.lessonId,
              teacherId: subject.teachers[0].id,
              classId: slot.classId,
            },
          });
        }

        return prisma.timetableSlot.create({
          data: {
            timetableId,
            day: slot.day,
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: false,
            subjectId: slot.lessonId,
            teacherId: lesson.teacherId,
          },
        });
      }
    });

    await Promise.all(slotPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating timetable slots:", error);
    return NextResponse.json(
      { error: "Failed to update timetable slots" },
      { status: 500 }
    );
  }
}
