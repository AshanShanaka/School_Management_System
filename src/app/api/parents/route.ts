import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId");
    const viewMode = searchParams.get("viewMode") || "list"; // Add viewMode parameter
    const ITEM_PER_PAGE = 10;

    const where: any = {};

    // Apply filters based on user role
    if (user.role === "student") {
      // Students see their parent only
      const student = await prisma.student.findUnique({
        where: { id: user.id },
      });

      if (student?.parentId) {
        where.id = student.parentId;
      } else {
        // No parent found, return empty
        return NextResponse.json({
          parents: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
    } else if (user.role === "teacher") {
      // Teachers see parents of students in their classes
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        include: {
          classes: {
            include: {
              students: {
                include: { parent: true },
              },
            },
          },
        },
      });

      const parentIds = new Set<string>();
      teacher?.classes?.forEach((cls) => {
        cls.students?.forEach((student) => {
          if (student.parentId) {
            parentIds.add(student.parentId);
          }
        });
      });

      where.id = { in: Array.from(parentIds) };
    }
    // Admin sees all parents (no additional filters)
    // Parent role typically doesn't need to see other parents

    // Add class filter for admin
    if (classId && user.role === "admin") {
      const classIdInt = parseInt(classId);
      if (!isNaN(classIdInt)) {
        where.students = {
          some: {
            classId: classIdInt,
          },
        };
      }
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { surname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Determine pagination based on view mode
    const isClassView = viewMode === "class";
    const take = isClassView ? undefined : ITEM_PER_PAGE; // No limit for class view
    const skip = isClassView ? undefined : (page - 1) * ITEM_PER_PAGE; // No skip for class view

    const [parents, total] = await prisma.$transaction([
      prisma.parent.findMany({
        where,
        include: {
          students: {
            include: {
              class: {
                include: { grade: true },
              },
            },
          },
        },
        ...(take && { take }),
        ...(skip !== undefined && { skip }),
        orderBy: { name: "asc" },
      }),
      prisma.parent.count({ where }),
    ]);

    return NextResponse.json({
      parents,
      total,
      page: isClassView ? 1 : page,
      totalPages: isClassView ? 1 : Math.ceil(total / ITEM_PER_PAGE),
      viewMode,
    });
  } catch (error) {
    console.error("Parents API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch parents" },
      { status: 500 }
    );
  }
}
