import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;
    const userId = user?.id;

    // Only teachers can take lesson-specific attendance
    if (role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { lessonId, date, attendance } = await request.json();

    if (!lessonId || !date || !attendance) {
      return NextResponse.json(
        { error: "Lesson ID, date, and attendance data are required" },
        { status: 400 }
      );
    }

    // Verify the lesson belongs to the teacher
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: parseInt(lessonId),
        teacherId: user?.id,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        {
          error:
            "Lesson not found or you don't have permission to take attendance for this lesson",
        },
        { status: 404 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Delete existing attendance records for this lesson and date
    await prisma.attendance.deleteMany({
      where: {
        lessonId: parseInt(lessonId),
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
    });

    // Create new attendance records
    const attendanceRecords = attendance.map(
      (record: { studentId: string; present: boolean }) => ({
        studentId: record.studentId,
        present: record.present,
        date: attendanceDate,
        lessonId: parseInt(lessonId),
      })
    );

    await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    const presentCount = attendance.filter((a: any) => a.present).length;
    const totalCount = attendance.length;

    return NextResponse.json({
      success: true,
      message: `Lesson attendance saved for ${totalCount} students. ${presentCount} present, ${
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
    console.error("Error saving lesson attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
