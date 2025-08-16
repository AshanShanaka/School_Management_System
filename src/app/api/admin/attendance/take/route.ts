import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Day } from "@prisma/client";

// Helper function to convert Date to Day enum
function getDayFromDate(date: Date): Day | null {
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const days: (Day | null)[] = [
    null,
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    null,
  ];
  return days[dayIndex];
}

export async function POST(request: NextRequest) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!role || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, date, attendance } = body;

    if (!classId || !date || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse the date and set time to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(8, 30, 0, 0); // Set to 8:30 AM

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOfWeek = getDayFromDate(attendanceDate);

    if (!dayOfWeek) {
      return NextResponse.json(
        { error: "Attendance can only be taken for weekdays (Monday-Friday)" },
        { status: 400 }
      );
    }

    // Get the first lesson of the day for this class (we'll use it as a reference)
    const firstLesson = await prisma.lesson.findFirst({
      where: {
        classId: classId,
        day: dayOfWeek,
      },
      orderBy: { startTime: "asc" },
    });

    if (!firstLesson) {
      return NextResponse.json(
        {
          error:
            "No lessons found for this class on this day. Cannot take attendance without a lesson reference.",
        },
        { status: 400 }
      );
    }

    // Delete existing attendance records for this class and date
    await prisma.attendance.deleteMany({
      where: {
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
        student: {
          classId: classId,
        },
      },
    });

    // Create new attendance records
    const attendanceRecords = attendance.map(
      (record: { studentId: string; present: boolean }) => ({
        studentId: record.studentId,
        present: record.present,
        date: attendanceDate,
        lessonId: firstLesson.id, // Use first lesson as reference
      })
    );

    await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    // Create activity log
    const presentCount = attendance.filter((a: any) => a.present).length;
    const totalCount = attendance.length;

    return NextResponse.json({
      success: true,
      message: `Attendance saved for ${totalCount} students. ${presentCount} present, ${
        totalCount - presentCount
      } absent.`,
      stats: {
        total: totalCount,
        present: presentCount,
        absent: totalCount - presentCount,
        attendanceRate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
