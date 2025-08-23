import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;

    // Verify token using the auth library
    const { verifyToken } = await import("@/lib/auth");
    const user = verifyToken(token);
    return user;
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromToken(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "student":
        // Check if student has related records
        const student = await prisma.student.findUnique({
          where: { id },
          include: {
            results: true,
            attendances: true,
          },
        });

        if (!student) {
          return NextResponse.json(
            { error: "Student not found" },
            { status: 404 }
          );
        }

        // Delete related records first
        await prisma.result.deleteMany({
          where: { studentId: id },
        });

        await prisma.attendance.deleteMany({
          where: { studentId: id },
        });

        // Delete the student
        result = await prisma.student.delete({
          where: { id },
        });
        break;

      case "teacher":
        // Check if teacher has related records
        const teacher = await prisma.teacher.findUnique({
          where: { id },
          include: {
            lessons: true,
            classes: true,
            subjectAssignments: true,
          },
        });

        if (!teacher) {
          return NextResponse.json(
            { error: "Teacher not found" },
            { status: 404 }
          );
        }

        // Remove teacher from classes (set supervisor to null)
        await prisma.class.updateMany({
          where: { supervisorId: id },
          data: { supervisorId: null },
        });

        // Delete subject assignments
        await prisma.subjectAssignment.deleteMany({
          where: { teacherId: id },
        });

        // Delete lessons taught by this teacher
        await prisma.lesson.deleteMany({
          where: { teacherId: id },
        });

        // Delete the teacher
        result = await prisma.teacher.delete({
          where: { id },
        });
        break;

      case "parent":
        // Check if parent has children
        const parent = await prisma.parent.findUnique({
          where: { id },
          include: {
            students: true,
          },
        });

        if (!parent) {
          return NextResponse.json(
            { error: "Parent not found" },
            { status: 404 }
          );
        }

        if (parent.students.length > 0) {
          return NextResponse.json(
            {
              error:
                "Cannot delete parent with children. Please assign children to another parent first.",
            },
            { status: 400 }
          );
        }

        // Delete the parent
        result = await prisma.parent.delete({
          where: { id },
        });
        break;

      case "class":
        // Check if class has students
        const classData = await prisma.class.findUnique({
          where: { id: parseInt(id) },
          include: {
            students: true,
            lessons: true,
            subjectAssignments: true,
          },
        });

        if (!classData) {
          return NextResponse.json(
            { error: "Class not found" },
            { status: 404 }
          );
        }

        if (classData.students.length > 0) {
          return NextResponse.json(
            {
              error:
                "Cannot delete class with students. Please move students to another class first.",
            },
            { status: 400 }
          );
        }

        // Delete related records
        await prisma.subjectAssignment.deleteMany({
          where: { classId: parseInt(id) },
        });

        await prisma.lesson.deleteMany({
          where: { classId: parseInt(id) },
        });

        // Delete the class
        result = await prisma.class.delete({
          where: { id: parseInt(id) },
        });
        break;

      case "grade":
        // Check if grade has classes
        const grade = await prisma.grade.findUnique({
          where: { id: parseInt(id) },
          include: {
            classess: true,
            students: true,
          },
        });

        if (!grade) {
          return NextResponse.json(
            { error: "Grade not found" },
            { status: 404 }
          );
        }

        if (grade.classess.length > 0 || grade.students.length > 0) {
          return NextResponse.json(
            {
              error:
                "Cannot delete grade with classes or students. Please delete or move them first.",
            },
            { status: 400 }
          );
        }

        // Delete the grade
        result = await prisma.grade.delete({
          where: { id: parseInt(id) },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } deleted successfully`,
      data: result,
    });
  } catch (error: any) {
    console.error("Delete error:", error);

    // Handle specific Prisma errors
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Cannot delete this record due to related data constraints. Please remove related records first.",
        },
        { status: 400 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: "Failed to delete record",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
