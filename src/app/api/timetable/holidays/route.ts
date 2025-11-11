// API Route: /api/timetable/holidays (GET, POST)
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch holidays
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    const where: any = {};

    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

// POST - Create new holiday
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, type, description, isRecurring } = body;

    // Validate required fields
    if (!name || !date) {
      return NextResponse.json(
        { error: "Missing required fields: name, date" },
        { status: 400 }
      );
    }

    // Check if holiday already exists on this date
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        date: new Date(date),
      },
    });

    if (existingHoliday) {
      return NextResponse.json(
        {
          error: `A holiday already exists on ${date}: ${existingHoliday.name}`,
        },
        { status: 400 }
      );
    }

    // Create holiday
    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        type: type || "PUBLIC",
        description: description || null,
        isRecurring: isRecurring || false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Holiday created successfully",
        holiday,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json(
      { error: "Failed to create holiday" },
      { status: 500 }
    );
  }
}

// DELETE - Delete holiday
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Holiday ID is required" },
        { status: 400 }
      );
    }

    const holiday = await prisma.holiday.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Holiday deleted successfully",
      holiday,
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
