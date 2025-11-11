import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, subjectId, teacherId, date, attendanceRecords } = body;

    // Validate required fields
    if (!classId || !subjectId || !teacherId || !date || !attendanceRecords) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert date to proper format
    const attendanceDate = new Date(date);

    // Create attendance records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, delete any existing attendance records for this date/class/subject
      await tx.attendance.deleteMany({
        where: {
          date: attendanceDate,
          lesson: {
            classId: parseInt(classId),
            subjectId: parseInt(subjectId)
          }
        }
      });

      // Find or create a lesson for this class/subject/teacher combination
      let lesson = await tx.lesson.findFirst({
        where: {
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          teacherId: teacherId
        }
      });

      if (!lesson) {
        // Create a lesson if it doesn't exist
        const dayOfWeek = attendanceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayMap: { [key: number]: string } = {
          1: 'MONDAY', 
          2: 'TUESDAY',
          3: 'WEDNESDAY',
          4: 'THURSDAY',
          5: 'FRIDAY'
        };

        // Default to MONDAY if it's weekend (Saturday/Sunday)
        const dayValue = dayMap[dayOfWeek] || 'MONDAY';

        lesson = await tx.lesson.create({
          data: {
            name: `${new Date(date).toLocaleDateString()} - Quick Attendance`,
            day: dayValue as any,
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            teacherId: teacherId,
            startTime: new Date(),
            endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
          }
        });
      }

      // Create new attendance records
      const attendanceData = attendanceRecords.map((record: any) => ({
        date: attendanceDate,
        present: record.present,
        studentId: record.studentId,
        lessonId: lesson.id
      }));

      const createdAttendance = await tx.attendance.createMany({
        data: attendanceData
      });

      return {
        lesson,
        attendanceCount: createdAttendance.count
      };
    });

    return NextResponse.json({
      success: true,
      message: `Attendance saved for ${result.attendanceCount} students`,
      lessonId: result.lesson.id
    });

  } catch (error) {
    console.error("Error saving bulk attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
