import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dropdown = searchParams.get("dropdown");
    
    // Simple dropdown API for forms
    if (dropdown === "true") {
      const classes = await prisma.class.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
      return NextResponse.json(classes);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const gradeId = searchParams.get("gradeId");
    const ITEM_PER_PAGE = 10;

    const where: any = {};

    // Add gradeId filter
    if (gradeId) {
      where.gradeId = parseInt(gradeId);
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          supervisor: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { surname: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [classes, total] = await prisma.$transaction([
      prisma.class.findMany({
        where,
        include: {
          grade: true,
          supervisor: true,
          students: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: (page - 1) * ITEM_PER_PAGE,
        orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
      }),
      prisma.class.count({ where }),
    ]);

    return NextResponse.json({
      classes,
      total,
      page,
      totalPages: Math.ceil(total / ITEM_PER_PAGE),
    });
  } catch (error) {
    console.error("Classes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(classId);

    // Check if class has any dependencies
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        students: true,
        lessons: true,
        events: true,
        announcements: true,
        _count: {
          select: {
            students: true,
            lessons: true,
            events: true,
            announcements: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if class has students or other dependencies
    const totalDependencies =
      classData._count.students +
      classData._count.lessons +
      classData._count.events +
      classData._count.announcements;

    if (totalDependencies > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete class ${classData.name}. It has dependencies: ${classData._count.students} students, ${classData._count.lessons} lessons, ${classData._count.events} events, ${classData._count.announcements} announcements. Please reassign or delete them first.`,
          dependencies: {
            students: classData._count.students,
            lessons: classData._count.lessons,
            events: classData._count.events,
            announcements: classData._count.announcements,
          },
        },
        { status: 400 }
      );
    }

    // Safe to delete
    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Delete class error:", error);

    // Handle Prisma foreign key constraint errors
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete class due to existing dependencies. Please remove all associated students, lessons, and other related data first.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
