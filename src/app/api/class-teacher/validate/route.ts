import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/class-teacher/validate
 * Check if a teacher is assigned as a class teacher
 * Query params: teacherId
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        surname: true,
        assignedClassId: true,
        assignedClass: {
          select: {
            id: true,
            name: true,
            capacity: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const isClassTeacher = !!teacher.assignedClassId;

    return NextResponse.json({
      isClassTeacher,
      teacher: {
        id: teacher.id,
        name: `${teacher.name} ${teacher.surname}`,
      },
      assignedClass: isClassTeacher ? {
        id: teacher.assignedClass!.id,
        name: teacher.assignedClass!.name,
        capacity: teacher.assignedClass!.capacity,
        gradeLevel: teacher.assignedClass!.grade.level,
      } : null,
    });

  } catch (error) {
    console.error("Error validating class teacher:", error);
    return NextResponse.json(
      { error: "Failed to validate class teacher status" },
      { status: 500 }
    );
  }
}
