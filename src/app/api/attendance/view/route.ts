import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/attendance/view - View attendance data with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const lessonId = searchParams.get("lessonId");

    const whereClause: any = {};

    if (classId) {
      const studentsInClass = await prisma.student.findMany({
        where: { classId: parseInt(classId) },
        select: { id: true },
      });
      whereClause.studentId = {
        in: studentsInClass.map((s) => s.id),
      };
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    if (lessonId) {
      whereClause.lessonId = parseInt(lessonId);
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        lesson: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate attendance statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.present).length;
    const absentCount = totalRecords - presentCount;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    const response = {
      records: attendanceRecords,
      statistics: {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
