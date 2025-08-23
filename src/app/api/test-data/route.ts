import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [teachers, students, parents] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.parent.count(),
    ]);

    const teacherList = await prisma.teacher.findMany({
      take: 3,
      include: {
        subjects: true,
        classes: true,
      },
    });

    const studentList = await prisma.student.findMany({
      take: 3,
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    const parentList = await prisma.parent.findMany({
      take: 3,
      include: {
        students: true,
      },
    });

    return NextResponse.json({
      counts: {
        teachers,
        students,
        parents,
      },
      sampleData: {
        teachers: teacherList,
        students: studentList,
        parents: parentList,
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: error },
      { status: 500 }
    );
  }
}
