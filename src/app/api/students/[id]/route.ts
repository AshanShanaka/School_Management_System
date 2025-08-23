import { getCurrentUser, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        class: {
          include: {
            grade: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        grade: true,
        attendances: {
          take: 10,
          orderBy: {
            date: "desc",
          },
        },
        results: {
          include: {
            exam: {
              include: {
                Subject: true,
              },
            },
          },
          take: 5,
          orderBy: {
            exam: {
              startTime: "desc",
            },
          },
        },
        _count: {
          select: {
            attendances: true,
            results: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check access permissions
    if (user.role === "parent" && student.parentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (user.role === "student" && student.id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Student GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
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
      classId,
      gradeId,
      parentId,
    } = body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check for duplicate email/username (excluding current student)
    const duplicateCheck = await prisma.student.findFirst({
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
      classId: classId ? parseInt(classId) : null,
      gradeId: gradeId ? parseInt(gradeId) : null,
      parentId: parentId || null,
    };

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: updateData,
      include: {
        parent: true,
        class: {
          include: {
            grade: true,
          },
        },
        grade: true,
      },
    });

    return NextResponse.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Student UPDATE error:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
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

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        attendances: true,
        results: true,
      },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.$transaction([
      // Delete attendances
      prisma.attendance.deleteMany({
        where: { studentId: params.id },
      }),
      // Delete results
      prisma.result.deleteMany({
        where: { studentId: params.id },
      }),
      // Finally delete student
      prisma.student.delete({
        where: { id: params.id },
      }),
    ]);

    return NextResponse.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Student DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
