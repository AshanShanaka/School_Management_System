import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch students for teacher's class and existing attendance for a date
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Only teachers can take attendance
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can take attendance" },
        { status: 403 }
      );
    }

    // Get classes where teacher is supervisor (class teacher)
    const supervisedClasses = await prisma.class.findMany({
      where: {
        supervisorId: user.id,
      },
      include: {
        grade: true,
        students: {
          orderBy: [{ surname: "asc" }, { name: "asc" }],
        },
      },
    });

    if (supervisedClasses.length === 0) {
      return NextResponse.json(
        { error: "You are not assigned as a class teacher for any class" },
        { status: 404 }
      );
    }

    // For simplicity, we'll work with the first supervised class
    // In real scenario, teacher might have multiple classes
    const classData = supervisedClasses[0];

    // Get existing attendance for the date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAttendance = await prisma.attendance.findMany({
      where: {
        classId: classData.id,
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
      include: {
        student: true,
      },
    });

    // Create attendance map
    const attendanceMap = new Map();
    existingAttendance.forEach((record) => {
      attendanceMap.set(record.studentId, record.present);
    });

    // Prepare student data with attendance status
    const studentsWithAttendance = classData.students.map((student) => ({
      id: student.id,
      name: student.name,
      surname: student.surname,
      present: attendanceMap.has(student.id) ? attendanceMap.get(student.id) : true, // Default to present
    }));

    return NextResponse.json({
      success: true,
      class: {
        id: classData.id,
        name: classData.name,
        grade: classData.grade,
      },
      students: studentsWithAttendance,
      date: date,
      hasExistingAttendance: existingAttendance.length > 0,
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}

// POST: Save daily attendance for the class
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const { classId, date, attendance, notes } = body;

    // Only teachers can take attendance
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can take attendance" },
        { status: 403 }
      );
    }

    // Verify teacher is supervisor of this class
    const classData = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        supervisorId: user.id,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "You are not authorized to take attendance for this class" },
        { status: 403 }
      );
    }

    // Validate attendance data
    if (!attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: "Invalid attendance data" },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    // Delete existing attendance for this date and class
    await prisma.attendance.deleteMany({
      where: {
        classId: parseInt(classId),
        date: {
          gte: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()),
          lt: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() + 1),
        },
      },
    });

    // Create new attendance records
    const attendanceRecords = attendance.map((record) => ({
      studentId: record.studentId,
      classId: parseInt(classId),
      teacherId: user.id,
      date: attendanceDate,
      present: record.present,
      notes: notes || null,
    }));

    await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    // Calculate statistics
    const totalStudents = attendance.length;
    const presentStudents = attendance.filter((record) => record.present).length;
    const absentStudents = totalStudents - presentStudents;

    return NextResponse.json({
      success: true,
      message: `Attendance saved successfully! ${presentStudents} present, ${absentStudents} absent.`,
      stats: {
        total: totalStudents,
        present: presentStudents,
        absent: absentStudents,
        attendanceRate: totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0,
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
