import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Check if attendance exists for a specific date and get summary stats
 * Query params: classId, date
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date");

    if (!classId || !date) {
      return NextResponse.json(
        { error: "Class ID and date are required" },
        { status: 400 }
      );
    }

    const classIdNum = parseInt(classId);

    // Validate permissions
    if (user.role === "teacher") {
      const classForTeacher = await prisma.class.findFirst({
        where: {
          id: classIdNum,
          classTeacherId: user.id,
        },
      });

      if (!classForTeacher) {
        const teachesClass = await prisma.lesson.findFirst({
          where: {
            teacherId: user.id,
            classId: classIdNum,
          },
        });

        if (!teachesClass) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 403 }
          );
        }
      }
    }

    // Check if attendance exists for this date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: new Date(date),
        student: {
          classId: classIdNum,
        },
      },
    });

    if (attendanceRecords.length === 0) {
      return NextResponse.json({
        hasAttendance: false,
        stats: null,
      });
    }

    // Calculate stats
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "PRESENT").length,
      absent: attendanceRecords.filter((r) => r.status === "ABSENT").length,
      late: attendanceRecords.filter((r) => r.status === "LATE").length,
    };

    return NextResponse.json({
      hasAttendance: true,
      stats,
      date,
    });
  } catch (error) {
    console.error("Error checking attendance:", error);
    return NextResponse.json(
      { error: "Failed to check attendance" },
      { status: 500 }
    );
  }
}
