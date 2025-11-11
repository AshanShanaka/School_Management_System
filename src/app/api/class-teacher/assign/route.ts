import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/class-teacher/assign
 * Assign a teacher as class teacher to a class (Admin only)
 * Body: { teacherId: string, classId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, classId } = body;

    // Validation
    if (!teacherId || !classId) {
      return NextResponse.json(
        { error: "Teacher ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        surname: true,
        assignedClassId: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Check if teacher is already assigned as class teacher
    if (teacher.assignedClassId) {
      return NextResponse.json(
        { 
          error: `This teacher is already assigned as class teacher for another class. A teacher can only be class teacher for one class at a time.`,
          currentClassId: teacher.assignedClassId,
        },
        { status: 400 }
      );
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        classTeacherId: true,
        grade: {
          select: {
            level: true,
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

    // Check if class already has a class teacher
    if (classData.classTeacherId) {
      return NextResponse.json(
        { 
          error: `This class already has a class teacher assigned. Each class can only have one class teacher.`,
          currentTeacherId: classData.classTeacherId,
        },
        { status: 400 }
      );
    }

    // Perform the assignment using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the Teacher to set assignedClassId
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          assignedClassId: classId,
        },
      });

      // Update the Class to set classTeacherId
      const updatedClass = await tx.class.update({
        where: { id: classId },
        data: {
          classTeacherId: teacherId,
        },
      });

      // Create assignment history record
      const assignment = await tx.classTeacherAssignment.create({
        data: {
          teacherId: teacherId,
          classId: classId,
          assignedBy: "admin", // TODO: Get actual admin ID from session
          isActive: true,
        },
      });

      return { updatedTeacher, updatedClass, assignment };
    });

    return NextResponse.json({
      success: true,
      message: `${teacher.name} ${teacher.surname} has been successfully assigned as class teacher for ${classData.name} (Grade ${classData.grade.level})`,
      data: {
        teacherId: result.updatedTeacher.id,
        classId: result.updatedClass.id,
        assignmentId: result.assignment.id,
        assignedAt: result.assignment.assignedAt,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error assigning class teacher:", error);
    
    // Handle unique constraint violation
    if ((error as any).code === "P2002") {
      return NextResponse.json(
        { error: "This assignment violates the unique constraint. The teacher or class may already be assigned." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to assign class teacher" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/class-teacher/assign
 * Remove class teacher assignment (Admin only)
 * Body: { teacherId: string } OR { classId: number }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, classId } = body;

    if (!teacherId && !classId) {
      return NextResponse.json(
        { error: "Either Teacher ID or Class ID is required" },
        { status: 400 }
      );
    }

    // Find the assignment
    let assignment;
    if (teacherId) {
      assignment = await prisma.classTeacherAssignment.findFirst({
        where: {
          teacherId: teacherId,
          isActive: true,
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              surname: true,
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
    } else if (classId) {
      assignment = await prisma.classTeacherAssignment.findFirst({
        where: {
          classId: classId,
          isActive: true,
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              surname: true,
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
    }

    if (!assignment) {
      return NextResponse.json(
        { error: "No active class teacher assignment found" },
        { status: 404 }
      );
    }

    // Remove the assignment using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update Teacher to remove assignedClassId
      await tx.teacher.update({
        where: { id: assignment.teacherId },
        data: {
          assignedClassId: null,
        },
      });

      // Update Class to remove classTeacherId
      await tx.class.update({
        where: { id: assignment.classId },
        data: {
          classTeacherId: null,
        },
      });

      // Mark assignment as inactive in history
      const updatedAssignment = await tx.classTeacherAssignment.update({
        where: { id: assignment.id },
        data: {
          isActive: false,
          removedAt: new Date(),
          removedBy: "admin", // TODO: Get actual admin ID from session
        },
      });

      return updatedAssignment;
    });

    return NextResponse.json({
      success: true,
      message: `${assignment.teacher.name} ${assignment.teacher.surname} has been removed as class teacher from ${assignment.class.name}`,
      data: {
        assignmentId: result.id,
        removedAt: result.removedAt,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error removing class teacher assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove class teacher assignment" },
      { status: 500 }
    );
  }
}
