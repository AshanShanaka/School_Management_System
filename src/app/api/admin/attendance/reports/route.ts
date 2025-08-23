import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;
    const userId = user?.id;

    if (!role || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "monthly";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const studentId = searchParams.get("studentId");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause based on role and filters
    let whereClause: any = {
      date: {
        gte: start,
        lte: end,
      },
    };

    // Role-based filtering
    if (role === "student") {
      whereClause.studentId = user?.id;
    } else if (role === "parent") {
      const children = await prisma.student.findMany({
        where: { parentId: user?.id },
        select: { id: true },
      });
      whereClause.studentId = { in: children.map((child) => child.id) };
    } else if (role === "teacher") {
      // Teacher can only see their own classes
      const teacherClasses = await prisma.class.findMany({
        where: { supervisorId: user?.id },
        select: { id: true },
      });
      whereClause.student = {
        classId: { in: teacherClasses.map((cls) => cls.id) },
      };
    }

    // Additional filters for admin
    if (role === "admin") {
      if (classId && classId !== "all") {
        whereClause.student = { classId: parseInt(classId) };
      }
      if (studentId && studentId !== "all") {
        whereClause.studentId = studentId;
      }
    }

    if (subjectId && subjectId !== "all") {
      whereClause.lesson = { subjectId: parseInt(subjectId) };
    }

    // Fetch attendance data with relationships
    const attendanceData = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
        lesson: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Group by student and calculate statistics
    const studentStats = new Map();

    attendanceData.forEach((attendance) => {
      const studentId = attendance.studentId;

      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          studentId,
          studentName: `${attendance.student.name} ${attendance.student.surname}`,
          className: `${attendance.student.class.grade.level}-${attendance.student.class.name}`,
          totalLessons: 0,
          presentLessons: 0,
          absentLessons: 0,
          lateCount: 0,
          subjectWiseAttendance: new Map(),
        });
      }

      const stats = studentStats.get(studentId);
      stats.totalLessons++;

      if (attendance.present) {
        stats.presentLessons++;
        // Check if late (assuming after 8:30 AM is late)
        const attendanceHour = new Date(attendance.date).getHours();
        if (
          attendanceHour > 8 ||
          (attendanceHour === 8 && new Date(attendance.date).getMinutes() > 30)
        ) {
          stats.lateCount++;
        }
      } else {
        stats.absentLessons++;
      }

      // Subject-wise tracking
      const subjectName = attendance.lesson.subject.name;
      if (!stats.subjectWiseAttendance.has(subjectName)) {
        stats.subjectWiseAttendance.set(subjectName, {
          subjectName,
          present: 0,
          total: 0,
          rate: 0,
        });
      }

      const subjectStats = stats.subjectWiseAttendance.get(subjectName);
      subjectStats.total++;
      if (attendance.present) {
        subjectStats.present++;
      }
      subjectStats.rate = (subjectStats.present / subjectStats.total) * 100;
    });

    // Convert to array and calculate attendance rates
    const reports = Array.from(studentStats.values()).map((stats: any) => ({
      ...stats,
      attendanceRate:
        stats.totalLessons > 0
          ? (stats.presentLessons / stats.totalLessons) * 100
          : 0,
      subjectWiseAttendance: Array.from(stats.subjectWiseAttendance.values()),
    }));

    // Sort by attendance rate (lowest first for attention)
    reports.sort((a, b) => a.attendanceRate - b.attendanceRate);

    return NextResponse.json({
      reports,
      summary: {
        totalStudents: reports.length,
        averageAttendanceRate:
          reports.reduce((sum, r) => sum + r.attendanceRate, 0) /
            reports.length || 0,
        studentsBelow85: reports.filter((r) => r.attendanceRate < 85).length,
        studentsBelow95: reports.filter((r) => r.attendanceRate < 95).length,
      },
    });
  } catch (error) {
    console.error("Error generating attendance reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
