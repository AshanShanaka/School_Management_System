import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ["teacher"]);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    const teacherId = authResult.user.id;

    // Get today's date
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get teacher's classes and subjects
    const teacherLessons = await prisma.lesson.findMany({
      where: {
        teacherId: teacherId,
      },
      include: {
        class: true,
        subject: true,
      },
    });

    // Get attendance records for today
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        lesson: {
          teacherId: teacherId,
        },
      },
      include: {
        lesson: {
          include: {
            class: true,
            subject: true,
          },
        },
        student: true,
      },
    });

    // Calculate statistics
    const totalStudents = attendanceRecords.length;
    const presentStudents = attendanceRecords.filter(
      (record) => record.present
    ).length;
    const absentStudents = totalStudents - presentStudents;
    const totalClasses = teacherLessons.length;

    return NextResponse.json({
      overview: {
        totalClasses,
        totalStudents,
        presentStudents,
        absentStudents,
        attendanceRate:
          totalStudents > 0
            ? Math.round((presentStudents / totalStudents) * 100)
            : 0,
      },
      recentAttendance: attendanceRecords.slice(0, 10), // Last 10 records
    });
  } catch (error) {
    console.error("Error fetching teacher attendance overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance overview" },
      { status: 500 }
    );
  }
}
