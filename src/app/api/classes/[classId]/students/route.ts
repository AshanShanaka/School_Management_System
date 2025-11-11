import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and teachers can view class student lists
    if (user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const classId = parseInt(params.classId);
    if (isNaN(classId)) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        grade: true,
        supervisor: {
          select: {
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
            username: true,
            phone: true,
            img: true,
            parent: {
              select: {
                name: true,
                surname: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: [{ surname: "asc" }, { name: "asc" }],
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      classData,
    });
  } catch (error) {
    console.error("Error fetching class students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
