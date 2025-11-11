import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/attendance/export - Export attendance data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { classId, startDate, endDate, format = "csv" } = data;

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Get attendance data
    const attendanceData = await prisma.attendance.findMany({
      where: {
        studentId: {
          in: await prisma.student
            .findMany({
              where: { classId: parseInt(classId) },
              select: { id: true },
            })
            .then((students) => students.map((s) => s.id)),
        },
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        student: {
          select: {
            name: true,
            surname: true,
            username: true,
          },
        },
        lesson: {
          select: {
            name: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Format data based on requested format
    if (format === "csv") {
      const csvHeader = "Student Name,Username,Date,Lesson,Subject,Present\n";
      const csvData = attendanceData
        .map((record) => {
          const studentName = `${record.student.name} ${record.student.surname}`;
          const date = record.date.toISOString().split("T")[0];
          const lesson = record.lesson?.name || "N/A";
          const subject = record.lesson?.subject?.name || "N/A";
          const present = record.present ? "Yes" : "No";
          
          return `"${studentName}","${record.student.username}","${date}","${lesson}","${subject}","${present}"`;
        })
        .join("\n");

      const csvContent = csvHeader + csvData;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(attendanceData);
  } catch (error) {
    console.error("Error exporting attendance:", error);
    return NextResponse.json(
      { error: "Failed to export attendance data" },
      { status: 500 }
    );
  }
}
