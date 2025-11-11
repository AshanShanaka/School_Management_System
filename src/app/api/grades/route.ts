import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true"; // Get all grades without pagination
    const ITEM_PER_PAGE = 10;

    // Build where clause for search
    const where = search
      ? {
          level: {
            equals: parseInt(search) || undefined,
          },
        }
      : {};

    // If "all" parameter is true, return all grades without pagination
    if (all) {
      const grades = await prisma.grade.findMany({
        where,
        orderBy: { level: "asc" },
      });

      console.log(`📚 Fetching all grades: Found ${grades.length} grades`);
      return NextResponse.json({ grades, total: grades.length });
    }

    // Get total count for pagination
    const total = await prisma.grade.count({ where });

    const grades = await prisma.grade.findMany({
      where,
      include: {
        classess: {
          include: {
            students: true,
          },
        },
        students: true,
        _count: {
          select: {
            classess: true,
            students: true,
          },
        },
      },
      orderBy: { level: "asc" },
      skip: (page - 1) * ITEM_PER_PAGE,
      take: ITEM_PER_PAGE,
    });

    return NextResponse.json({ grades, total });
  } catch (error) {
    console.error("Grades API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
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
    const gradeId = searchParams.get("id");

    if (!gradeId) {
      return NextResponse.json(
        { error: "Grade ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(gradeId);

    // Check if grade has any dependencies
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        classess: true,
        students: true,
      },
    });

    if (!grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    // Check if grade has classes or students
    if (grade.classess.length > 0 || grade.students.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete grade ${grade.level}. It has ${grade.classess.length} classes and ${grade.students.length} students. Please reassign or delete them first.`,
          dependencies: {
            classes: grade.classess.length,
            students: grade.students.length,
          },
        },
        { status: 400 }
      );
    }

    // Safe to delete
    await prisma.grade.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Grade deleted successfully" });
  } catch (error) {
    console.error("Delete grade error:", error);

    // Handle Prisma foreign key constraint errors
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete grade due to existing dependencies. Please remove all associated classes and students first.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 }
    );
  }
}
