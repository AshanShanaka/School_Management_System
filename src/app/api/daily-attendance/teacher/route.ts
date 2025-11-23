import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch daily attendance for teacher's assigned class
 * Query params: date (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Find the class where this teacher is the class teacher
    const classInfo = await prisma.class.findFirst({
      where: {
        classTeacherId: user.id,
      },
      include: {
        grade: true,
        students: {
          select: {
            id: true,
            name: true,
            surname: true,
            img: true,
          },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        },
        classTeacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    if (!classInfo) {
      return NextResponse.json(
        { error: "You are not assigned as a class teacher" },
        { status: 403 }
      );
    }

    // Get attendance records for the specified date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAttendance = await prisma.attendance.findMany({
      where: {
        classId: classInfo.id,
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
    });

    // Create a map of student attendance
    const attendanceMap = new Map();
    existingAttendance.forEach((record) => {
      attendanceMap.set(record.studentId, {
        id: record.id,
        status: record.status || (record.present ? "PRESENT" : "ABSENT"),
        notes: record.notes,
        updatedAt: record.updatedAt,
      });
    });

    // Combine students with their attendance status
    const studentsWithAttendance = classInfo.students.map((student) => {
      const attendance = attendanceMap.get(student.id);
      return {
        ...student,
        attendanceId: attendance?.id || null,
        status: attendance?.status || "PRESENT",
        notes: attendance?.notes || "",
        updatedAt: attendance?.updatedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      class: {
        id: classInfo.id,
        name: classInfo.name,
        grade: classInfo.grade,
        classTeacher: classInfo.classTeacher,
      },
      students: studentsWithAttendance,
      date: date,
      hasExistingAttendance: existingAttendance.length > 0,
      canEdit: true, // Teacher can always edit their own class
    });
  } catch (error) {
    console.error("Error fetching teacher attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
