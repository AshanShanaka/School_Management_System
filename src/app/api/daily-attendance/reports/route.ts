import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { error: "Unauthorized - Teacher access required" },
        { status: 403 }
      );
    }

    // Get the range parameter
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "month";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setDate(now.getDate() - 30);
        break;
      case "term":
        // Assume term is 90 days
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Find the class where this teacher is the class teacher
    const teacherClass = await prisma.class.findFirst({
      where: {
        classTeacherId: user.id,
      },
      include: {
        grade: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!teacherClass) {
      return NextResponse.json(
        { error: "You are not assigned as a class teacher to any class" },
        { status: 403 }
      );
    }

    // Get all attendance records for this class within the date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: teacherClass.id,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: teacherClass.id,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        img: true,
      },
    });

    // Group attendance by date to calculate daily statistics
    const dailyAttendanceMap = new Map<string, { present: number; absent: number; late: number; total: number }>();
    
    attendanceRecords.forEach((record) => {
      const dateKey = record.date.toISOString().split("T")[0];
      
      if (!dailyAttendanceMap.has(dateKey)) {
        dailyAttendanceMap.set(dateKey, { present: 0, absent: 0, late: 0, total: 0 });
      }
      
      const dayStat = dailyAttendanceMap.get(dateKey)!;
      dayStat.total++;
      
      if (record.status === "PRESENT") {
        dayStat.present++;
      } else if (record.status === "ABSENT") {
        dayStat.absent++;
      } else if (record.status === "LATE") {
        dayStat.late++;
      }
    });

    // Convert map to array
    const dailyRecords = Array.from(dailyAttendanceMap.entries()).map(([date, stats]) => ({
      date,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      total: stats.total,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate per-student statistics
    const studentAttendancePromises = students.map(async (student) => {
      const studentRecords = await prisma.attendance.findMany({
        where: {
          studentId: student.id,
          classId: teacherClass.id,
          date: {
            gte: startDate,
            lte: now,
          },
        },
      });

      const presentCount = studentRecords.filter((r) => r.status === "PRESENT").length;
      const absentCount = studentRecords.filter((r) => r.status === "ABSENT").length;
      const lateCount = studentRecords.filter((r) => r.status === "LATE").length;
      const totalDays = studentRecords.length;

      // Calculate attendance percentage (late counts as 0.5)
      const attendancePercentage = totalDays > 0
        ? ((presentCount + lateCount * 0.5) / totalDays) * 100
        : 0;

      return {
        id: student.id,
        name: student.name,
        surname: student.surname,
        img: student.img,
        presentCount,
        absentCount,
        lateCount,
        totalDays,
        attendancePercentage,
      };
    });

    const studentRecords = await Promise.all(studentAttendancePromises);

    return NextResponse.json({
      class: {
        id: teacherClass.id,
        name: teacherClass.name,
        grade: {
          id: teacherClass.grade.id,
          level: teacherClass.grade.level,
        },
      },
      dailyRecords,
      studentRecords,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
        range,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance reports" },
      { status: 500 }
    );
  }
}
