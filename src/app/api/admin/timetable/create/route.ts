import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { TIMETABLE_CONFIG } from "@/lib/timetableConfig";

export async function POST(request: NextRequest) {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const academicYear = formData.get("academicYear") as string;
    const classId = parseInt(formData.get("classId") as string);

    if (!name || !academicYear || !classId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Create the timetable
    const timetable = await prisma.timetable.create({
      data: {
        name,
        academicYear,
        classId,
        isActive: true, // Make it active by default
      },
    });

    // Create timetable slots
    const slotsToCreate = [];

    for (const day of TIMETABLE_CONFIG.days) {
      for (const timeSlot of TIMETABLE_CONFIG.timeSlots) {
        const subjectKey = `slot_${day}_${timeSlot.period}_subject`;
        const teacherKey = `slot_${day}_${timeSlot.period}_teacher`;

        const subjectId = formData.get(subjectKey);
        const teacherId = formData.get(teacherKey);

        slotsToCreate.push({
          timetableId: timetable.id,
          day: day as any,
          period: timeSlot.period,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          isBreak: timeSlot.isBreak,
          subjectId:
            subjectId && subjectId !== ""
              ? parseInt(subjectId as string)
              : null,
          teacherId:
            teacherId && teacherId !== "" ? (teacherId as string) : null,
        });
      }
    }

    // Create all slots
    await prisma.timetableSlot.createMany({
      data: slotsToCreate,
    });

    // Deactivate other timetables for this class
    await prisma.timetable.updateMany({
      where: {
        classId,
        id: { not: timetable.id },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.redirect(
      new URL(`/list/timetables/${timetable.id}`, request.url)
    );
  } catch (error) {
    console.error("Error creating timetable:", error);
    return NextResponse.json(
      { error: "Failed to create timetable" },
      { status: 500 }
    );
  }
}
