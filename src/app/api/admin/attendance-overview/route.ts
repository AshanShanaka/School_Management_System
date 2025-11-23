import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Get all classes with student counts
    const classes = await prisma.class.findMany({
      include: {
        grade: true,
        students: {
          select: {
            id: true,
          },
        },
        classTeacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: [
        { grade: { level: "desc" } },
        { name: "asc" },
      ],
    });

    // Get attendance data for the selected date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: selectedDate,
          lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        student: {
          select: {
            classId: true,
          },
        },
      },
    });

    // Get weekly attendance data (last 5 days)
    const fiveDaysAgo = new Date(selectedDate);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);

    const weeklyAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: fiveDaysAgo,
          lte: selectedDate,
        },
      },
      include: {
        student: {
          select: {
            classId: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Process class-wise data
    const classAttendanceData = classes.map((cls) => {
      const totalStudents = cls.students.length;
      const todayRecords = attendanceRecords.filter(
        (record) => record.student.classId === cls.id
      );

      const presentToday = todayRecords.filter((r) => r.status === "PRESENT").length;
      const absentToday = todayRecords.filter((r) => r.status === "ABSENT").length;
      const lateToday = todayRecords.filter((r) => r.status === "LATE").length;

      const attendanceRate =
        totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0;

      // Calculate weekly trend
      const weeklyTrend = [];
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      
      for (let i = 0; i < 5; i++) {
        const checkDate = new Date(fiveDaysAgo);
        checkDate.setDate(checkDate.getDate() + i);
        
        const dayRecords = weeklyAttendance.filter((record) => {
          const recordDate = new Date(record.date);
          return (
            record.student.classId === cls.id &&
            recordDate.toDateString() === checkDate.toDateString()
          );
        });

        weeklyTrend.push({
          date: days[i],
          present: dayRecords.filter((r) => r.status === "PRESENT").length,
          absent: dayRecords.filter((r) => r.status === "ABSENT").length,
          late: dayRecords.filter((r) => r.status === "LATE").length,
        });
      }

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade.level,
        totalStudents,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        weeklyTrend,
        classTeacher: cls.classTeacher
          ? `${cls.classTeacher.name} ${cls.classTeacher.surname}`
          : null,
      };
    });

    // Calculate overall statistics
    const totalStudents = classAttendanceData.reduce(
      (sum, cls) => sum + cls.totalStudents,
      0
    );
    const totalPresent = classAttendanceData.reduce(
      (sum, cls) => sum + cls.presentToday,
      0
    );
    const totalAbsent = classAttendanceData.reduce(
      (sum, cls) => sum + cls.absentToday,
      0
    );
    const totalLate = classAttendanceData.reduce(
      (sum, cls) => sum + cls.lateToday,
      0
    );
    const overallRate =
      totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

    // Get monthly trend (last 5 months)
    const monthlyTrend = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 4; i >= 0; i--) {
      const monthDate = new Date(selectedDate);
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthRecords = await prisma.attendance.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const monthPresent = monthRecords.filter((r) => r.status === "PRESENT").length;
      const monthTotal = monthRecords.length;
      const monthRate = monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0;

      monthlyTrend.push({
        month: monthNames[monthDate.getMonth()],
        rate: Number(monthRate.toFixed(1)),
      });
    }

    // Calculate grade-wise attendance
    const gradeWiseMap = new Map<number, { present: number; total: number }>();
    
    classAttendanceData.forEach((cls) => {
      const existing = gradeWiseMap.get(cls.grade) || { present: 0, total: 0 };
      gradeWiseMap.set(cls.grade, {
        present: existing.present + cls.presentToday,
        total: existing.total + cls.totalStudents,
      });
    });

    const gradeWiseData = Array.from(gradeWiseMap.entries())
      .map(([grade, data]) => ({
        grade: `Grade ${grade}`,
        attendance: data.total > 0 ? Number(((data.present / data.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => parseInt(a.grade.split(" ")[1]) - parseInt(b.grade.split(" ")[1]));

    return NextResponse.json({
      totalStudents,
      totalPresent,
      totalAbsent,
      totalLate,
      overallRate: Number(overallRate.toFixed(1)),
      classes: classAttendanceData,
      monthlyTrend,
      gradeWiseData,
      date: selectedDate.toISOString().split("T")[0],
    });
  } catch (error: any) {
    console.error("Error fetching attendance overview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
