import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    console.log("Debug API - Current user:", user);

    const students = await prisma.student.findMany({
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
      take: 5, // Just get first 5
    });

    const teachers = await prisma.teacher.findMany({
      include: {
        subjects: true,
        classes: true,
      },
      take: 5,
    });

    const parents = await prisma.parent.findMany({
      include: {
        students: true,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      currentUser: user,
      data: {
        studentsCount: await prisma.student.count(),
        teachersCount: await prisma.teacher.count(),
        parentsCount: await prisma.parent.count(),
        sampleStudents: students,
        sampleTeachers: teachers,
        sampleParents: parents,
      },
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
}
