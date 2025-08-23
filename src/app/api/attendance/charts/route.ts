import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const role = user?.role;
  const userId = user?.id;

  if (!role || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("timeRange") || "month";
  const studentId = searchParams.get("studentId");
  const classId = searchParams.get("classId");

  try {
    // Calculate date range
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setDate(today.getDate() - 30);
        break;
      case "term":
        startDate.setDate(today.getDate() - 120);
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    // Base attendance query filters
    let attendanceFilters: any = {
      date: {
        gte: startDate,
        lte: today,
      },
    };

    // Role-based filtering
    if (role === "student") {
      attendanceFilters.studentId = user?.id;
    } else if (role === "parent") {
      // Get parent's children
      const children = await prisma.student.findMany({
        where: { parentId: user?.id },
        select: { id: true },
      });
      attendanceFilters.studentId = { in: children.map((c) => c.id) };
    } else if (role === "teacher") {
      // Get teacher's classes
      const teacherClasses = await prisma.class.findMany({
        where: { supervisorId: user?.id },
        select: { id: true },
      });
      if (teacherClasses.length > 0) {
        attendanceFilters.student = {
          classId: { in: teacherClasses.map((c) => c.id) },
        };
      }
    }

    // Apply additional filters
    if (studentId && (role === "admin" || role === "teacher")) {
      attendanceFilters.studentId = studentId;
    }

    if (classId && (role === "admin" || role === "teacher")) {
      attendanceFilters.student = {
        classId: parseInt(classId),
      };
    }

    // Fetch attendance data
    const attendanceRecords = await prisma.attendance.findMany({
      where: attendanceFilters,
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
      },
      orderBy: {
        date: "asc",
      },
    });

    // Generate daily data
    const dailyData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      // Skip weekends for school attendance
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayRecords = attendanceRecords.filter(
          (record) => record.date.toISOString().split("T")[0] === dateStr
        );

        const present = dayRecords.filter((r) => r.present).length;
        const absent = dayRecords.filter((r) => !r.present).length;
        const total = dayRecords.length;

        dailyData.push({
          date: currentDate.toLocaleDateString(),
          dayName: currentDate.toLocaleDateString("en-US", {
            weekday: "short",
          }),
          present,
          absent,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary statistics
    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter((r) => r.present).length;
    const absentRecords = attendanceRecords.filter((r) => !r.present).length;

    // Count unique days with records
    const uniqueDays = new Set(
      attendanceRecords.map((r) => r.date.toISOString().split("T")[0])
    ).size;

    const summary = {
      totalDays: uniqueDays,
      presentDays: dailyData.filter((d) => d.present > 0).length,
      absentDays: dailyData.filter((d) => d.absent > 0 && d.present === 0)
        .length,
      attendanceRate:
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0,
    };

    // Class comparison data (for admin/teacher)
    let classData: any[] = [];
    if ((role === "admin" || role === "teacher") && !studentId) {
      let classesToAnalyze: any[] = [];

      if (role === "admin") {
        classesToAnalyze = await prisma.class.findMany({
          include: { grade: true },
        });
      } else if (role === "teacher") {
        classesToAnalyze = await prisma.class.findMany({
          where: { supervisorId: user?.id },
          include: { grade: true },
        });
      }

      classData = await Promise.all(
        classesToAnalyze.map(async (cls) => {
          const classAttendance = await prisma.attendance.findMany({
            where: {
              date: {
                gte: startDate,
                lte: today,
              },
              student: {
                classId: cls.id,
              },
            },
          });

          const classTotal = classAttendance.length;
          const classPresent = classAttendance.filter((r) => r.present).length;
          const classAbsent = classAttendance.filter((r) => !r.present).length;

          return {
            className: `${cls.grade.level}-${cls.name}`,
            presentRate:
              classTotal > 0
                ? Math.round((classPresent / classTotal) * 100)
                : 0,
            absentRate:
              classTotal > 0 ? Math.round((classAbsent / classTotal) * 100) : 0,
          };
        })
      );
    }

    return NextResponse.json({
      dailyData,
      summary,
      classData,
    });
  } catch (error) {
    console.error("Error fetching attendance chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance chart data" },
      { status: 500 }
    );
  }
}
