import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const { user, error } = await requireAuth(request);
    
    if (!user || error) {
      return NextResponse.json(
        { error: error || "Authentication required" },
        { status: 401 }
      );
    }

    const classId = parseInt(params.classId);

    if (isNaN(classId)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const classData = await prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        grade: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: classData.id,
      name: classData.name,
      capacity: classData.capacity,
      studentCount: classData._count.students,
      supervisor: classData.supervisor,
      grade: classData.grade,
    });

  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
