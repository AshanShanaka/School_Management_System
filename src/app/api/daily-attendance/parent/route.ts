import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const period = searchParams.get("period") || "month";

    // If no studentId, return list of children
    if (!studentId) {
      const students = await prisma.student.findMany({
        where: {
          parentId: user.id,
        },
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        students,
      });
    }

    // Verify this is the parent's child
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        parentId: user.id,
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found or unauthorized" },
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
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch attendance records
    const records = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
        date: {
          gte: startDate,
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

    // Calculate stats
    const total = records.length;
    const present = records.filter((r) => r.present).length;
    const absent = records.filter((r) => !r.present).length;
    const late = 0; // If you have a late field, count it here

    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Format records
    const formattedRecords = records.map((record) => ({
      id: record.id,
      date: record.date.toISOString(),
      status: record.present ? "PRESENT" : "ABSENT",
      notes: null,
      teacher: record.teacher,
    }));

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        surname: student.surname,
        img: student.img,
        class: {
          id: student.class.id,
          name: student.class.name,
          grade: {
            level: student.class.grade.level,
          },
        },
      },
      records: formattedRecords,
      stats: {
        total,
        present,
        late,
        absent,
      },
      attendancePercentage,
    });
  } catch (error) {
    console.error("Error fetching parent attendance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
