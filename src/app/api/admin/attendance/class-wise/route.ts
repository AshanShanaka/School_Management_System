import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const role = user?.role;

  if (!role || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily"; // daily, weekly, monthly, yearly
  const classId = searchParams.get("classId");
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const selectedDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    // Calculate date ranges based on period
    switch (period) {
      case "daily":
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday
        endDate.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        startDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        endDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );
        endDate.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
    }

    // Get all classes with their attendance data
    let classFilters: any = {};
    if (classId) {
      classFilters.id = parseInt(classId);
    }

    const classes = await prisma.class.findMany({
      where: classFilters,
      include: {
        grade: true,
        students: {
          include: {
            attendances: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
      orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
    });

    // Process class-wise attendance data
    const classWiseData = classes.map((classItem) => {
      const totalStudents = classItem.students.length;

      if (period === "daily") {
        // For daily view, show today's attendance
        const presentStudents = classItem.students.filter((student) =>
          student.attendances.some((att) => att.present)
        ).length;
        const absentStudents = classItem.students.filter(
          (student) =>
            student.attendances.length === 0 ||
            student.attendances.every((att) => !att.present)
        ).length;

        return {
          classId: classItem.id,
          className: `${classItem.grade.level}-${classItem.name}`,
          gradeLevel: classItem.grade.level,
          totalStudents,
          presentToday: presentStudents,
          absentToday: absentStudents,
          attendanceRate:
            totalStudents > 0
              ? Math.round((presentStudents / totalStudents) * 100)
              : 0,
        };
      } else {
        // For weekly/monthly/yearly view, calculate average attendance
        const allAttendanceRecords = classItem.students.flatMap(
          (student) => student.attendances
        );
        const totalRecords = allAttendanceRecords.length;
        const presentRecords = allAttendanceRecords.filter(
          (att) => att.present
        ).length;

        // Calculate unique days with attendance records
        const uniqueDays = new Set(
          allAttendanceRecords.map(
            (att) => att.date.toISOString().split("T")[0]
          )
        ).size;

        const avgPresent =
          uniqueDays > 0
            ? Math.round((presentRecords / totalStudents / uniqueDays) * 100) /
              100
            : 0;
        const avgAbsent =
          uniqueDays > 0
            ? Math.round(
                ((totalRecords - presentRecords) / totalStudents / uniqueDays) *
                  100
              ) / 100
            : 0;

        return {
          classId: classItem.id,
          className: `${classItem.grade.level}-${classItem.name}`,
          gradeLevel: classItem.grade.level,
          totalStudents,
          averagePresent: avgPresent,
          averageAbsent: avgAbsent,
          totalDays: uniqueDays,
          attendanceRate:
            totalRecords > 0
              ? Math.round((presentRecords / totalRecords) * 100)
              : 0,
        };
      }
    });

    // Calculate overall summary
    const overallSummary = {
      totalClasses: classes.length,
      totalStudents: classWiseData.reduce(
        (sum, cls) => sum + cls.totalStudents,
        0
      ),
      averageAttendanceRate:
        classWiseData.length > 0
          ? Math.round(
              classWiseData.reduce((sum, cls) => sum + cls.attendanceRate, 0) /
                classWiseData.length
            )
          : 0,
    };

    if (period === "daily") {
      Object.assign(overallSummary, {
        totalPresent: classWiseData.reduce(
          (sum, cls) => sum + (cls.presentToday || 0),
          0
        ),
        totalAbsent: classWiseData.reduce(
          (sum, cls) => sum + (cls.absentToday || 0),
          0
        ),
        totalLate: 0, // Late tracking not implemented in current schema
      });
    }

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      overallSummary,
      classWiseData,
    });
  } catch (error) {
    console.error("Error fetching class-wise attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
