import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - List all holidays
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const classId = searchParams.get("classId");
    const gradeLevel = searchParams.get("gradeLevel");

    const where: any = {};

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (classId) {
      where.OR = [
        { affectsAllClasses: true },
        { classId: parseInt(classId) },
      ];
    }

    if (gradeLevel) {
      where.OR = [
        ...(where.OR || []),
        { gradeLevel: parseInt(gradeLevel) },
      ];
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: {
        date: "asc",
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

// POST - Create a new holiday
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      name,
      description,
      type,
      isRecurring,
      recurYearly,
      affectsAllClasses,
      classId,
      gradeLevel,
      blocksScheduling,
    } = body;

    if (!date || !name || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        description: description || null,
        type,
        isRecurring: isRecurring || false,
        recurYearly: recurYearly || false,
        affectsAllClasses: affectsAllClasses ?? true,
        classId: classId || null,
        gradeLevel: gradeLevel || null,
        blocksScheduling: blocksScheduling ?? true,
      },
    });

    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json(
      { error: "Failed to create holiday" },
      { status: 500 }
    );
  }
}
