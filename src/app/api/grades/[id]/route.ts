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

    const grade = await prisma.grade.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        classess: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            classess: true,
          },
        },
      },
    });

    if (!grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    return NextResponse.json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { level } = body;

    if (!level) {
      return NextResponse.json({ error: "Level is required" }, { status: 400 });
    }

    // Check if a grade with this level already exists (excluding current grade)
    const existingGrade = await prisma.grade.findFirst({
      where: {
        level: level,
        NOT: {
          id: parseInt(params.id),
        },
      },
    });

    if (existingGrade) {
      return NextResponse.json(
        { error: `Grade ${level} already exists` },
        { status: 400 }
      );
    }

    const updatedGrade = await prisma.grade.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        level: level,
      },
      include: {
        classess: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            classess: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGrade);
  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gradeId = parseInt(params.id);

    // Check if grade exists
    const grade = await prisma.grade.findUnique({
      where: {
        id: gradeId,
      },
      include: {
        classess: {
          include: {
            students: true,
          },
        },
      },
    });

    if (!grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Check if grade has any classes with students
    const hasStudents = grade.classess.some(cls => cls.students.length > 0);
    
    if (hasStudents) {
      return NextResponse.json(
        { error: "Cannot delete grade that has classes with students enrolled" },
        { status: 400 }
      );
    }

    // Check if grade has any classes
    if (grade.classess.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete grade that has classes. Please delete all classes first." },
        { status: 400 }
      );
    }

    // Delete the grade
    await prisma.grade.delete({
      where: {
        id: gradeId,
      },
    });

    return NextResponse.json({ message: "Grade deleted successfully" });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
