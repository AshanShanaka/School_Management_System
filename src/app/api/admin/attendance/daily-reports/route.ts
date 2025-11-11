import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Only admin can view attendance reports
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can view attendance reports" },
        { status: 403 }
      );
    }

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all classes with their students and attendance for the date
    const classes = await prisma.class.findMany({
      include: {
        grade: true,
        students: true,
        attendance: {
          where: {
            date: {
              gte: reportDate,
              lt: nextDay,
            },
          },
        },
      },
      orderBy: [
        { grade: { level: "asc" } },
        { name: "asc" },
      ],
    });

    // Process each class to create report
    const reports = classes.map((classData) => {
      const totalStudents = classData.students.length;
      const attendanceRecords = classData.attendance;
      
      const presentToday = attendanceRecords.filter((record) => record.present).length;
      const absentToday = attendanceRecords.filter((record) => !record.present).length;
      
      // If no attendance is taken, all students are considered absent
      const actualAbsent = attendanceRecords.length === 0 ? totalStudents : absentToday;
      const actualPresent = attendanceRecords.length === 0 ? 0 : presentToday;
      
      const attendanceRate = totalStudents > 0 ? (actualPresent / totalStudents) * 100 : 0;

      return {
        classId: classData.id,
        className: classData.name,
        gradeLevel: classData.grade.level,
        totalStudents,
        presentToday: actualPresent,
        absentToday: actualAbsent,
        attendanceRate,
        hasAttendanceData: attendanceRecords.length > 0,
      };
    });

    // Calculate overall statistics
    const totalClasses = reports.length;
    const totalStudents = reports.reduce((sum, report) => sum + report.totalStudents, 0);
    const totalPresent = reports.reduce((sum, report) => sum + report.presentToday, 0);
    const totalAbsent = reports.reduce((sum, report) => sum + report.absentToday, 0);
    const overallAttendanceRate = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

    const stats = {
      totalClasses,
      totalStudents,
      totalPresent,
      totalAbsent,
      overallAttendanceRate,
    };

    return NextResponse.json({
      success: true,
      reports,
      stats,
      date,
    });
  } catch (error) {
    console.error("Error fetching attendance reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance reports" },
      { status: 500 }
    );
  }
}
