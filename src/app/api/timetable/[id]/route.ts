// API Route: /api/timetable/[id] - CRUD operations for timetables
// Role: Admin only for modifications, all roles for viewing
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  validateCompleteTimetable,
  type TimetableSlotInput,
} from "@/lib/timetableValidation";

/**
 * GET - Fetch a specific timetable with full details
 * Access: All authenticated users (Admin, Teacher, Student, Parent)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const timetableId = params.id;

    // Fetch timetable with all relations
    const timetable = await prisma.schoolTimetable.findUnique({
      where: { id: timetableId },
      include: {
        class: {
          include: {
            grade: true,
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        slots: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
          orderBy: [{ day: "asc" }, { period: "asc" }],
        },
      },
    });

    if (!timetable) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    // Role-based access control
    if (user.role === "student") {
      // Students can only view their own class timetable
      const student = await prisma.student.findUnique({
        where: { id: user.id },
        select: { classId: true },
      });

      if (student?.classId !== timetable.classId) {
        return NextResponse.json(
          { error: "Access denied: Not your class timetable" },
          { status: 403 }
        );
      }
    } else if (user.role === "parent") {
      // Parents can only view their children's timetables
      const parent = await prisma.parent.findUnique({
        where: { id: user.id },
        include: {
          students: {
            select: { classId: true },
          },
        },
      });

      const childClassIds = parent?.students.map((s) => s.classId) || [];
      if (!childClassIds.includes(timetable.classId)) {
        return NextResponse.json(
          { error: "Access denied: Not your child's timetable" },
          { status: 403 }
        );
      }
    }
    // Teachers and Admins can view all timetables

    return NextResponse.json({
      success: true,
      timetable,
      canEdit: user.role === "admin", // Only admins can edit
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

// PUT - Update timetable (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authorization
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { academicYear, term, slots, isActive } = body;

    // Check if timetable exists
    const existingTimetable = await prisma.schoolTimetable.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!existingTimetable) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    // Validate slots if provided
    let validation = { isValid: true, errors: [], warnings: [] };
    if (slots && Array.isArray(slots)) {
      validation = await validateCompleteTimetable(
        slots as TimetableSlotInput[],
        existingTimetable.classId,
        id
      );

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Timetable validation failed",
            errors: validation.errors,
            warnings: validation.warnings,
          },
          { status: 400 }
        );
      }
    }

    // Update timetable in a transaction
    const timetable = await prisma.$transaction(async (tx) => {
      // Update timetable metadata
      const updatedTimetable = await tx.schoolTimetable.update({
        where: { id },
        data: {
          academicYear: academicYear || existingTimetable.academicYear,
          term: term !== undefined ? term : existingTimetable.term,
          isActive: isActive !== undefined ? isActive : existingTimetable.isActive,
          updatedAt: new Date(),
        },
      });

      // If slots are provided, replace all slots
      if (slots && Array.isArray(slots)) {
        // Delete existing slots
        await tx.timetableSlot.deleteMany({
          where: { timetableId: id },
        });

        // Create new slots
        const slotPromises = slots.map((slot: any) =>
          tx.timetableSlot.create({
            data: {
              timetableId: id,
              day: slot.day,
              period: slot.period,
              startTime: slot.startTime,
              endTime: slot.endTime,
              slotType: slot.slotType || "REGULAR",
              subjectId: slot.subjectId ? parseInt(slot.subjectId) : null,
              teacherId: slot.teacherId || null,
              roomNumber: slot.roomNumber || null,
              notes: slot.notes || null,
            },
          })
        );

        await Promise.all(slotPromises);
      }

      return updatedTimetable;
    });

    // Fetch complete timetable with relations
    const completeTimetable = await prisma.schoolTimetable.findUnique({
      where: { id: timetable.id },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        slots: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: [{ day: "asc" }, { period: "asc" }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Timetable updated successfully",
      timetable: completeTimetable,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error("Error updating timetable:", error);
    return NextResponse.json(
      { error: "Failed to update timetable" },
      { status: 500 }
    );
  }
}

// DELETE - Delete timetable (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authorization
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if timetable exists
    const existingTimetable = await prisma.schoolTimetable.findUnique({
      where: { id },
      include: {
        class: true,
        slots: true,
      },
    });

    if (!existingTimetable) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    // Delete timetable and its slots (cascade will handle slots)
    await prisma.schoolTimetable.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Timetable for ${existingTimetable.class.name} has been deleted. ${existingTimetable.slots.length} slots removed.`,
      deletedTimetable: {
        id: existingTimetable.id,
        className: existingTimetable.class.name,
        slotsDeleted: existingTimetable.slots.length,
      },
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable" },
      { status: 500 }
    );
  }
}
