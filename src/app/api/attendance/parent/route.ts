import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch attendance records for a specific child
 * Query params: 
 *   - studentId (required): ID of the child
 *   - period (optional): today, week, month, year
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const period = searchParams.get("period") || "month";

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Verify that the student belongs to this parent
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: user.id,
      },
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
      return NextResponse.json(
        { error: "Student not found or not associated with this parent" },
        { status: 404 }
      );
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
        studentId: studentId,
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
    console.error("Error fetching parent attendance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
