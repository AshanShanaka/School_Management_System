import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.user;

    if (user.role !== "parent") {
      return NextResponse.json(
        { error: "Forbidden: Only parents can access this endpoint" },
        { status: 403 }
      );
    }

    // Fetch parent's children
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: {
        students: {
          include: {
            grade: true,
            class: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      );
    }

    const children = parent.students.map((student) => ({
      id: student.id,
      name: student.name,
      surname: student.surname,
      grade: student.grade ? { name: student.grade.name } : null,
      class: student.class ? { name: student.class.name } : null,
      className: student.class ? student.class.name : 'N/A',
      parentId: parent.id,
      classTeacherId: student.class?.classTeacherId || null,
    }));

    return NextResponse.json({ 
      success: true,
      children 
    });
  } catch (error) {
    console.error("[Parent Children API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch children",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
