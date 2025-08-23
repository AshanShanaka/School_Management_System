import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;
    const userId = user?.id;

    if (role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const period = searchParams.get("period") || "monthly";

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Verify teacher is supervisor of this class
    const classData = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        supervisorId: user?.id,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "You are not authorized to view this class" },
        { status: 403 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "overall":
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId: parseInt(classId) },
      select: {
        id: true,
        name: true,
        surname: true,
      },
    });

    // Get attendance data for each student
    const studentAttendanceData = await Promise.all(
      students.map(async (student) => {
        // Overall attendance
        const overallAttendance = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            date: { gte: new Date(now.getFullYear(), 0, 1) },
          },
        });

        // Period-specific attendance
        const periodAttendance = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            date: { gte: startDate, lte: now },
          },
          orderBy: { date: "desc" },
        });

        // Calculate rates
        const overallPresent = overallAttendance.filter(
          (a) => a.present
        ).length;
        const overallTotal = overallAttendance.length;
        const overallRate =
          overallTotal > 0 ? (overallPresent / overallTotal) * 100 : 100;

        const periodPresent = periodAttendance.filter((a) => a.present).length;
        const periodTotal = periodAttendance.length;
        const periodRate =
          periodTotal > 0 ? (periodPresent / periodTotal) * 100 : 100;

        // Calculate consecutive absences
        let consecutiveAbsences = 0;
        for (const attendance of periodAttendance) {
          if (!attendance.present) {
            consecutiveAbsences++;
          } else {
            break;
          }
        }

        // Find last seen date
        const lastPresent = overallAttendance
          .filter((a) => a.present)
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

        const lastSeenDate = lastPresent ? lastPresent.date : new Date(0);

        // Determine alert level
        let alertLevel: "none" | "warning" | "critical" = "none";
        if (consecutiveAbsences >= 5 || overallRate < 75) {
          alertLevel = "critical";
        } else if (consecutiveAbsences >= 3 || overallRate < 85) {
          alertLevel = "warning";
        }

        return {
          studentId: student.id,
          studentName: `${student.name} ${student.surname}`,
          overallAttendanceRate: overallRate,
          monthlyAttendanceRate: periodRate,
          weeklyAttendanceRate: periodRate, // Same as period rate for consistency
          lastSeenDate: lastSeenDate.toISOString(),
          totalAbsences: overallAttendance.filter((a) => !a.present).length,
          consecutiveAbsences,
          alertLevel,
        };
      })
    );

    // Sort by alert level and attendance rate
    studentAttendanceData.sort((a, b) => {
      const alertOrder = { critical: 3, warning: 2, none: 1 };
      if (alertOrder[a.alertLevel] !== alertOrder[b.alertLevel]) {
        return alertOrder[b.alertLevel] - alertOrder[a.alertLevel];
      }
      return a.overallAttendanceRate - b.overallAttendanceRate;
    });

    return NextResponse.json({
      students: studentAttendanceData,
      summary: {
        totalStudents: studentAttendanceData.length,
        criticalAlerts: studentAttendanceData.filter(
          (s) => s.alertLevel === "critical"
        ).length,
        warningAlerts: studentAttendanceData.filter(
          (s) => s.alertLevel === "warning"
        ).length,
        goodAttendance: studentAttendanceData.filter(
          (s) => s.overallAttendanceRate >= 95
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching class attendance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch class attendance data" },
      { status: 500 }
    );
  }
}
