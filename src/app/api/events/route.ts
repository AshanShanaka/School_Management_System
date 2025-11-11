import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/notificationService";

const prisma = new PrismaClient();

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (classId) {
      whereClause.classId = parseInt(classId);
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = new Date(startDate);
      if (endDate) whereClause.startTime.lte = new Date(endDate);
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, description, startTime, endTime, classId } = data;

    if (!title || !startTime) {
      return NextResponse.json(
        { error: "Title and start time are required" },
        { status: 400 }
      );
    }

    const eventData: any = {
      title,
      description,
      startTime: new Date(startTime),
    };

    if (endTime) {
      eventData.endTime = new Date(endTime);
    }

    if (classId) {
      eventData.classId = parseInt(classId);
    }

    const event = await prisma.event.create({
      data: eventData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notifications for all relevant users
    try {
      await NotificationService.createEventNotification(event);
    } catch (notificationError) {
      console.error("Error creating event notifications:", notificationError);
      // Don't fail the entire request if notifications fail
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
