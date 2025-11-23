import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch the teacher's assigned class (homeroom/class teacher)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
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
                id: true,
                level: true,
              },
            },
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    if (!teacher.assignedClass) {
      return NextResponse.json({
        success: true,
        hasAssignedClass: false,
        message: "No class assigned as class teacher",
      });
    }

    return NextResponse.json({
      success: true,
      hasAssignedClass: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        surname: teacher.surname,
      },
      class: {
        id: teacher.assignedClass.id,
        name: teacher.assignedClass.name,
        grade: teacher.assignedClass.grade,
        capacity: teacher.assignedClass.capacity,
        studentCount: teacher.assignedClass._count.students,
      },
    });
  } catch (error) {
    console.error("Error fetching assigned class:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned class" },
      { status: 500 }
    );
  }
}
