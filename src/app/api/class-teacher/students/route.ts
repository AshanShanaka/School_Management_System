import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: {
        classes: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Get all students from teacher's classes
    const students = await prisma.student.findMany({
      where: {
        classId: {
          in: teacher.classes.map(c => c.id),
        },
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        surname: s.surname,
        email: s.email,
        phone: s.phone,
        className: s.class.name,
        parentId: s.parentId,
        classTeacherId: teacher.id,
        parent: s.parent,
      })),
    });
  } catch (error) {
    console.error("Error fetching class teacher students:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
