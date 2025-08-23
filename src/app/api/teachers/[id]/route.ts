import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// GET single teacher
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        subjects: true,
        classes: {
          include: {
            grade: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
            classes: true,
            subjects: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Teacher GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    );
  }
}

// UPDATE teacher
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
    const {
      username,
      name,
      surname,
      email,
      phone,
      address,
      sex,
      birthday,
      password,
      subjects,
    } = body;

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: params.id },
    });

    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check for duplicate email/username (excluding current teacher)
    const duplicateCheck = await prisma.teacher.findFirst({
      where: {
        AND: [
          { id: { not: params.id } },
          {
            OR: [{ email: email }, { username: username }],
          },
        ],
      },
    });

    if (duplicateCheck) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      username,
      name,
      surname,
      email,
      phone,
      address,
      sex,
      birthday: new Date(birthday),
    };

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id: params.id },
      data: updateData,
      include: {
        subjects: true,
        classes: {
          include: {
            grade: true,
          },
        },
      },
    });

    // Update subjects if provided
    if (subjects && Array.isArray(subjects)) {
      // First, remove all existing subject assignments
      await prisma.teacher.update({
        where: { id: params.id },
        data: {
          subjects: {
            set: [],
          },
        },
      });

      // Then add new subjects
      if (subjects.length > 0) {
        await prisma.teacher.update({
          where: { id: params.id },
          data: {
            subjects: {
              connect: subjects.map((subjectId: string) => ({
                id: parseInt(subjectId),
              })),
            },
          },
        });
      }
    }

    return NextResponse.json({
      message: "Teacher updated successfully",
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error("Teacher UPDATE error:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

// DELETE teacher
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        lessons: true,
        classes: true,
        subjects: true,
      },
    });

    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if teacher has associated data
    const hasAssociatedData =
      existingTeacher.lessons.length > 0 || existingTeacher.classes.length > 0;

    if (hasAssociatedData) {
      return NextResponse.json(
        {
          error:
            "Cannot delete teacher with associated lessons or classes. Please reassign them first.",
        },
        { status: 400 }
      );
    }

    // Delete teacher (this will also remove subject associations due to implicit many-to-many)
    await prisma.teacher.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Teacher DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}
