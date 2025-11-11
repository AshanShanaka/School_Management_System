import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/notificationService";

const prisma = new PrismaClient();

// GET /api/announcements - Get all announcements
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, description, date, classId } = data;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : new Date(),
        classId: classId || null,
      },
    });

    // Create notifications for all relevant users
    try {
      await NotificationService.createAnnouncementNotification(announcement);
    } catch (notificationError) {
      console.error("Error creating announcement notifications:", notificationError);
      // Don't fail the entire request if notifications fail
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
