import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch attendance records for the logged-in student
 * Query params: period (today, week, month, year)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        surname: true,
        img: true,
        class: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
    }

    // Fetch attendance records
    const records = await prisma.attendance.findMany({
      where: {
        studentId: user.id,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
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
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === "PRESENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
    };

    // Calculate attendance percentage
    const attendancePercentage = stats.total > 0 
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      student: {
        name: student.name,
        surname: student.surname,
        img: student.img,
        class: student.class,
      },
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        status: r.status,
        notes: r.notes,
        teacher: r.teacher,
      })),
      stats,
      attendancePercentage,
    });
  } catch (error) {
    console.error("Error fetching student attendance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
