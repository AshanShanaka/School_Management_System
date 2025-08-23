import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;
    const userId = user?.id;

    if (role !== "admin" && role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId, date, attendance } = await request.json();

    // Validate input
    if (!slotId || !date || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the timetable slot with related data
    const slot = await prisma.timetableSlot.findUnique({
      where: { id: slotId },
      include: {
        subject: true,
        teacher: true,
        timetable: {
          include: {
            class: {
              include: {
                students: true,
              },
            },
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Timetable slot not found" },
        { status: 404 }
      );
    }

    // Validate it's a school day
    const validSchoolDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ];
    if (!validSchoolDays.includes(slot.day)) {
      return NextResponse.json(
        {
          error:
            "Attendance can only be taken on school days (Monday to Friday)",
        },
        { status: 400 }
      );
    }

    // Check if user is authorized to take attendance for this slot
    if (role === "teacher" && slot.teacherId !== user?.id) {
      return NextResponse.json(
        { error: "You are not assigned to this time slot" },
        { status: 403 }
      );
    }

    // Validate that all students in attendance belong to the class
    const classStudentIds = slot.timetable.class.students.map((s) => s.id);
    const attendanceStudentIds = attendance.map((a: any) => a.studentId);
    const invalidStudents = attendanceStudentIds.filter(
      (id) => !classStudentIds.includes(id)
    );

    if (invalidStudents.length > 0) {
      return NextResponse.json(
        { error: "Some students do not belong to this class" },
        { status: 400 }
      );
    }

    // Find or create a lesson for this timetable slot
    let lesson = await prisma.lesson.findFirst({
      where: {
        subjectId: slot.subjectId!,
        classId: slot.timetable.classId,
        teacherId: slot.teacherId!,
        day: slot.day,
        startTime: {
          equals: new Date(`1970-01-01T${slot.startTime}:00`),
        },
        endTime: {
          equals: new Date(`1970-01-01T${slot.endTime}:00`),
        },
      },
    });

    if (!lesson && slot.subjectId && slot.teacherId) {
      // Create a lesson for this slot if it doesn't exist
      lesson = await prisma.lesson.create({
        data: {
          name: `${slot.subject?.name} - Period ${slot.period}`,
          day: slot.day,
          startTime: new Date(`1970-01-01T${slot.startTime}:00`),
          endTime: new Date(`1970-01-01T${slot.endTime}:00`),
          subjectId: slot.subjectId,
          classId: slot.timetable.classId,
          teacherId: slot.teacherId,
        },
      });
    }

    if (!lesson) {
      return NextResponse.json(
        { error: "Unable to create or find lesson for this slot" },
        { status: 400 }
      );
    }

    // Prepare the date range for the selected date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Delete existing attendance for this lesson and date
    await prisma.attendance.deleteMany({
      where: {
        lessonId: lesson.id,
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
    });

    // Create new attendance records
    const attendanceRecords = attendance.map((record: any) => ({
      studentId: record.studentId,
      lessonId: lesson.id,
      date: attendanceDate,
      present: record.present,
    }));

    await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance saved successfully",
        lessonId: lesson.id,
        recordsCreated: attendanceRecords.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving timetable-based attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;
    const userId = user?.id;

    if (role !== "admin" && role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");
    const date = searchParams.get("date");

    if (!slotId || !date) {
      return NextResponse.json(
        { error: "Missing slotId or date parameter" },
        { status: 400 }
      );
    }

    // Get the timetable slot
    const slot = await prisma.timetableSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: {
        subject: true,
        teacher: true,
        timetable: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Timetable slot not found" },
        { status: 404 }
      );
    }

    // Validate it's a school day
    const validSchoolDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ];
    if (!validSchoolDays.includes(slot.day)) {
      return NextResponse.json(
        {
          error:
            "Attendance can only be accessed on school days (Monday to Friday)",
        },
        { status: 400 }
      );
    }

    // Check authorization
    if (role === "teacher" && slot.teacherId !== user?.id) {
      return NextResponse.json(
        { error: "You are not assigned to this time slot" },
        { status: 403 }
      );
    }

    // Find the lesson for this slot
    const lesson = await prisma.lesson.findFirst({
      where: {
        ...(slot.subjectId && { subjectId: slot.subjectId }),
        classId: slot.timetable.classId,
        ...(slot.teacherId && { teacherId: slot.teacherId }),
        day: slot.day,
        startTime: {
          equals: new Date(`1970-01-01T${slot.startTime}:00`),
        },
        endTime: {
          equals: new Date(`1970-01-01T${slot.endTime}:00`),
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { attendance: [], message: "No lesson found for this slot" },
        { status: 200 }
      );
    }

    // Get attendance for the specified date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        lessonId: lesson.id,
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
            img: true,
          },
        },
      },
    });

    return NextResponse.json({
      attendance: attendanceRecords,
      lesson: {
        id: lesson.id,
        name: lesson.name,
        subject: slot.subject?.name,
        class: `${slot.timetable.class.name}`,
        period: slot.period,
        timeSlot: `${slot.startTime} - ${slot.endTime}`,
      },
    });
  } catch (error) {
    console.error("Error fetching timetable-based attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
