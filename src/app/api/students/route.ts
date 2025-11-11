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
    const gradeId = searchParams.get("gradeId");
    const viewMode = searchParams.get("viewMode") || "list"; // Add viewMode parameter
    const ITEM_PER_PAGE = 10;

    const where: any = {};

    // Apply filters based on user role
    if (user.role === "teacher") {
      // Teachers see students in their classes
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        include: { classes: true },
      });

      const classIds = teacher?.classes?.map((cls) => cls.id) || [];
      where.classId = { in: classIds };
    } else if (user.role === "parent") {
      // Parents see only their children
      where.parentId = user.id;
    } else if (user.role === "student") {
      // Students see their classmates
      const student = await prisma.student.findUnique({
        where: { id: user.id },
      });

      if (student?.classId) {
        where.classId = student.classId;
      }
    }
    // Admin sees all students (no additional filters)

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { surname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add class filter
    if (classId) {
      const classIdInt = parseInt(classId);
      if (!isNaN(classIdInt)) {
        where.classId = classIdInt;
      }
    }

    // Add grade filter
    if (gradeId) {
      const gradeIdInt = parseInt(gradeId);
      if (!isNaN(gradeIdInt)) {
        where.class = {
          gradeId: gradeIdInt,
        };
      }
    }

    // Determine pagination based on view mode
    const isClassView = viewMode === "class";
    const take = isClassView ? undefined : ITEM_PER_PAGE; // No limit for class view
    const skip = isClassView ? undefined : (page - 1) * ITEM_PER_PAGE; // No skip for class view

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          class: {
            include: { grade: true },
          },
          parent: true,
        },
        ...(take && { take }),
        ...(skip !== undefined && { skip }),
        orderBy: { name: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      total,
      page: isClassView ? 1 : page,
      totalPages: isClassView ? 1 : Math.ceil(total / ITEM_PER_PAGE),
      viewMode,
    });
  } catch (error) {
    console.error("Students API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
