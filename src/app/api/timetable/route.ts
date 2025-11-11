// API Route: /api/timetable (GET, POST)
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  validateCompleteTimetable,
  type TimetableSlotInput,
} from "@/lib/timetableValidation";

const prisma = new PrismaClient();

// GET - Fetch timetable(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const timetableId = searchParams.get("timetableId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Fetch specific timetable by ID
    if (timetableId) {
      const timetable = await prisma.schoolTimetable.findUnique({
        where: { id: timetableId },
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

      if (!timetable) {
        return NextResponse.json(
          { error: "Timetable not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(timetable);
    }

    // Fetch timetable by class ID
    if (classId) {
      const timetable = await prisma.schoolTimetable.findFirst({
        where: {
          classId: parseInt(classId),
          isActive: includeInactive ? undefined : true,
        },
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

      return NextResponse.json(timetable || null);
    }

    // Fetch all active timetables
    const timetables = await prisma.schoolTimetable.findMany({
      where: {
        isActive: includeInactive ? undefined : true,
      },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(timetables);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

// POST - Create new timetable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, academicYear, term, slots, createdBy } = body;

    // Validate required fields
    if (!classId || !academicYear || !slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Missing required fields: classId, academicYear, slots" },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
    });

    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if timetable already exists for this class
    const existingTimetable = await prisma.schoolTimetable.findUnique({
      where: { classId: parseInt(classId) },
    });

    if (existingTimetable) {
      return NextResponse.json(
        {
          error: "A timetable already exists for this class. Please update the existing timetable instead.",
          existingTimetableId: existingTimetable.id,
        },
        { status: 409 }
      );
    }

    // Validate all slots
    const validation = await validateCompleteTimetable(
      slots as TimetableSlotInput[],
      parseInt(classId)
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

    // Create timetable with slots in a transaction
    const timetable = await prisma.$transaction(async (tx) => {
      // Create timetable
      const newTimetable = await tx.schoolTimetable.create({
        data: {
          classId: parseInt(classId),
          academicYear,
          term: term || null,
          isActive: true,
          createdBy: createdBy || null,
        },
      });

      // Create all slots
      const slotPromises = slots.map((slot: any) =>
        tx.timetableSlot.create({
          data: {
            timetableId: newTimetable.id,
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

      return newTimetable;
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

    return NextResponse.json(
      {
        success: true,
        message: "Timetable created successfully",
        timetable: completeTimetable,
        warnings: validation.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating timetable:", error);
    return NextResponse.json(
      { error: "Failed to create timetable" },
      { status: 500 }
    );
  }
}
