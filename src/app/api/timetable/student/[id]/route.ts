// API Route: /api/timetable/student/[id] (GET)
// Get student's class timetable
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: studentId } = params;

    // Get student with class info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            grade: true,
            classTeacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get active timetable for student's class
    const timetable = await prisma.schoolTimetable.findFirst({
      where: {
        classId: student.classId,
        isActive: true,
      },
      include: {
        slots: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: [{ day: "asc" }, { period: "asc" }],
        },
      },
    });

    if (!timetable) {
      return NextResponse.json({
        student: {
          id: student.id,
          name: student.name,
          surname: student.surname,
          class: student.class,
        },
        timetable: null,
        message: "No active timetable found for your class",
      });
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        surname: student.surname,
        class: {
          id: student.class.id,
          name: student.class.name,
          gradeLevel: student.class.grade.level,
          classTeacher: student.class.classTeacher,
        },
      },
      timetable: {
        id: timetable.id,
        academicYear: timetable.academicYear,
        term: timetable.term,
        slots: timetable.slots,
      },
    });
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch student timetable" },
      { status: 500 }
    );
  }
}
