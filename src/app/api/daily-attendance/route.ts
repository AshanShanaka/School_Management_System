import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch daily attendance for a class and date
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
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    const classIdNum = parseInt(classId);

    // Validate permissions based on role
    if (user.role === "teacher") {
      // Check if teacher is the class teacher for this class
      const classForTeacher = await prisma.class.findFirst({
        where: { 
          id: classIdNum,
          classTeacherId: user.id 
        },
      });

      if (!classForTeacher) {
        // Also allow if they teach a subject in this class (view-only)
        const teachesClass = await prisma.lesson.findFirst({
          where: {
            teacherId: user.id,
            classId: classIdNum,
          },
        });

        if (!teachesClass) {
          return NextResponse.json(
            { error: "You can only view attendance for classes you teach" },
            { status: 403 }
          );
        }
      }
    }

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classIdNum },
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
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get attendance records for the specified date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAttendance = await prisma.attendance.findMany({
      where: {
        classId: classIdNum,
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
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
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
        markedBy: record.teacher,
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
        notes: attendance?.notes || null,
        markedBy: attendance?.markedBy || null,
        updatedAt: attendance?.updatedAt || null,
      };
    });

    // Check if user can edit (only class teacher and admin)
    const canEdit =
      user.role === "admin" ||
      (user.role === "teacher" && classInfo.classTeacher?.id === user.id);

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
      canEdit,
    });
  } catch (error) {
    console.error("Error fetching daily attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}

/**
 * POST: Save/Update daily attendance for a class
 * Body: { classId, date, attendance: [{ studentId, status, notes }] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { classId, date, attendance } = body;

    if (!classId || !date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const classIdNum = parseInt(classId);

    // Validate permissions - only class teacher or admin can edit
    if (user.role === "teacher") {
      const classForTeacher = await prisma.class.findFirst({
        where: { 
          id: classIdNum,
          classTeacherId: user.id 
        },
      });

      if (!classForTeacher) {
        return NextResponse.json(
          { error: "Only the class teacher can mark attendance for this class" },
          { status: 403 }
        );
      }
    } else if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Validate class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classIdNum },
    });

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validate date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Validate all students belong to this class
    const studentIds = attendance.map((a) => a.studentId);
    const studentsInClass = await prisma.student.count({
      where: {
        id: { in: studentIds },
        classId: classIdNum,
      },
    });

    if (studentsInClass !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students do not belong to this class" },
        { status: 400 }
      );
    }

    // Upsert attendance records
    const results = await Promise.all(
      attendance.map(async (record) => {
        // Convert status to boolean for present field (backward compatibility)
        const present = record.status === "PRESENT" || record.status === "LATE";
        
        return prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId: classIdNum,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status || "PRESENT",
            present: present,
            notes: record.notes || null,
            teacherId: user.id,
            updatedAt: new Date(),
          },
          create: {
            studentId: record.studentId,
            classId: classIdNum,
            date: attendanceDate,
            status: record.status || "PRESENT",
            present: present,
            notes: record.notes || null,
            teacherId: user.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: "Attendance saved successfully",
      recordsUpdated: results.length,
    });
  } catch (error) {
    console.error("Error saving daily attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
