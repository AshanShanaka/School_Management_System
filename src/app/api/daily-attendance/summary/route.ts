import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch attendance summary for a student
 * Query params: studentId, startDate, endDate, period (today, week, month, year)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let studentId = searchParams.get("studentId");
    const period = searchParams.get("period") || "month";

    // If no studentId provided and user is a student, use their ID
    if (!studentId && user.role === "student") {
      studentId = user.id;
    }

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Validate permissions
    if (user.role === "student" && studentId !== user.id) {
      return NextResponse.json(
        { error: "You can only view your own attendance" },
        { status: 403 }
      );
    }

    if (user.role === "parent") {
      // Check if this is the parent's child
      const isMyChild = await prisma.student.findFirst({
        where: {
          id: studentId,
          parentId: user.id,
        },
      });

      if (!isMyChild) {
        return NextResponse.json(
          { error: "You can only view your children's attendance" },
          { status: 403 }
        );
      }
    }

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Calculate date range based on period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);

    switch (period) {
      case "today":
        // Already set
        break;
      case "week":
        // Get start of week (Monday)
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
        startDate.setDate(today.getDate() + diff);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        break;
      default:
        // Use custom dates if provided
        const customStart = searchParams.get("startDate");
        const customEnd = searchParams.get("endDate");
        if (customStart) startDate = new Date(customStart);
        if (customEnd) {
          endDate = new Date(customEnd);
          endDate.setDate(endDate.getDate() + 1);
        }
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        class: {
          select: {
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate statistics
    const totalDays = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
    const lateCount = attendanceRecords.filter((r) => r.status === "LATE").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "ABSENT").length;
    
    const attendanceRate = totalDays > 0 
      ? ((presentCount + lateCount) / totalDays) * 100 
      : 100;

    // Group by date for calendar view
    const recordsByDate = attendanceRecords.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          status: record.status,
          notes: record.notes,
          markedBy: record.teacher,
        };
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        surname: student.surname,
        class: student.class,
      },
      period: period,
      dateRange: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: new Date(endDate.getTime() - 1).toISOString().split("T")[0],
      },
      statistics: {
        totalDays,
        presentCount,
        lateCount,
        absentCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
      records: attendanceRecords.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split("T")[0],
        status: r.status,
        notes: r.notes,
        markedBy: r.teacher,
        class: r.class,
      })),
      calendar: recordsByDate,
    });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance summary" },
      { status: 500 }
    );
  }
}
