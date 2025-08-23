import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId, teacherId, classId } = await request.json();

    if (!subjectId || !teacherId || !classId) {
      return NextResponse.json(
        { error: "Subject ID, Teacher ID, and Class ID are required" },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.subjectAssignment.findUnique({
      where: {
        subjectId_teacherId_classId: {
          subjectId: parseInt(subjectId),
          teacherId: teacherId,
          classId: parseInt(classId),
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This subject-teacher-class assignment already exists" },
        { status: 400 }
      );
    }

    // Create new assignment
    const assignment = await prisma.subjectAssignment.create({
      data: {
        subjectId: parseInt(subjectId),
        teacherId: teacherId,
        classId: parseInt(classId),
      },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error creating subject assignment:", error);
    return NextResponse.json(
      { error: "Failed to create subject assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const teacherId = searchParams.get("teacherId");
    const classId = searchParams.get("classId");

    if (!subjectId || !teacherId || !classId) {
      return NextResponse.json(
        { error: "Subject ID, Teacher ID, and Class ID are required" },
        { status: 400 }
      );
    }

    await prisma.subjectAssignment.delete({
      where: {
        subjectId_teacherId_classId: {
          subjectId: parseInt(subjectId),
          teacherId: teacherId,
          classId: parseInt(classId),
        },
      },
    });

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete subject assignment" },
      { status: 500 }
    );
  }
}
