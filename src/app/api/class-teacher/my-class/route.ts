import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/class-teacher/my-class - Get teacher's assigned class
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can access this endpoint" },
        { status: 403 }
      );
    }

    // Find teacher with their assigned class(es)
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: {
        classes: {
          include: {
            grade: true,
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
                username: true,
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

    // Check if teacher has any assigned classes
    if (!teacher.classes || teacher.classes.length === 0) {
      return NextResponse.json({
        class: null,
        message: "Not assigned as a class teacher",
      });
    }

    // Return the first assigned class (teachers typically have one class)
    const assignedClass = teacher.classes[0];

    return NextResponse.json({
      class: {
        id: assignedClass.id,
        name: assignedClass.name,
        gradeId: assignedClass.gradeId,
        grade: assignedClass.grade,
        studentCount: assignedClass.students.length,
        students: assignedClass.students,
      },
      allClasses: teacher.classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        gradeId: cls.gradeId,
        grade: cls.grade,
        studentCount: cls.students.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching teacher class:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher class" },
      { status: 500 }
    );
  }
}
