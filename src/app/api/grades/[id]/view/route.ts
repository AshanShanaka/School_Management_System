import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the grade with all its classes and students
    const grade = await prisma.grade.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        classess: {
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                phone: true,
                address: true,
                img: true,
                bloodType: true,
                sex: true,
                createdAt: true,
              },
              orderBy: {
                name: "asc",
              },
            },
            _count: {
              select: {
                students: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Format the response data
    const gradeView = {
      id: grade.id,
      level: grade.level,
      classes: grade.classess.map((classItem) => ({
        id: classItem.id,
        name: classItem.name,
        capacity: classItem.capacity,
        supervisor: classItem.supervisor
          ? {
              id: classItem.supervisor.id,
              name: classItem.supervisor.name,
              surname: classItem.supervisor.surname,
              email: classItem.supervisor.email,
            }
          : null,
        _count: {
          students: classItem._count.students,
        },
        students: classItem.students.map((student) => ({
          id: student.id,
          name: student.name,
          surname: student.surname,
          email: student.email,
          phone: student.phone,
          address: student.address,
          img: student.img,
          bloodType: student.bloodType,
          sex: student.sex,
          createdAt: student.createdAt,
        })),
      })),
    };

    return NextResponse.json(gradeView);
  } catch (error) {
    console.error("Error fetching grade view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
