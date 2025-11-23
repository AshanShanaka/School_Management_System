import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET: Fetch current teacher's information
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
        email: true,
        assignedClassId: true,
        assignedClass: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                id: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Error fetching teacher info:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher information" },
      { status: 500 }
    );
  }
}
