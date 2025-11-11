import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dropdown = searchParams.get("dropdown");
    
    // Simple dropdown API for forms
    if (dropdown === "true") {
      const teachers = await prisma.teacher.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
        },
        orderBy: [
          { name: "asc" },
          { surname: "asc" },
        ],
      });
      return NextResponse.json(teachers);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId");
    const getAll = searchParams.get("all") === "true"; // New parameter to get all teachers
    const ITEM_PER_PAGE = getAll ? 1000 : 10; // Get many more if "all" is requested

    const where: any = {};

    // For supervisor assignment, skip role-based filtering if "all" is requested
    if (!getAll) {
      // Apply filters based on user role
      if (user.role === "student") {
        // Students see their teachers
        const student = await prisma.student.findUnique({
          where: { id: user.id },
          include: {
            class: { include: { lessons: { include: { teacher: true } } } },
          },
        });

        const teacherIds =
          student?.class?.lessons?.map((lesson) => lesson.teacher.id) || [];
        where.id = { in: teacherIds };
      } else if (user.role === "parent") {
        // Parents see their children's teachers
        const parent = await prisma.parent.findUnique({
          where: { id: user.id },
          include: {
            students: {
              include: {
                class: { include: { lessons: { include: { teacher: true } } } },
              },
            },
          },
        });

        const teacherIds = new Set<string>();
        parent?.students?.forEach((student) => {
          student.class?.lessons?.forEach((lesson) => {
            teacherIds.add(lesson.teacher.id);
          });
        });

        where.id = { in: Array.from(teacherIds) };
      }
    }
    // Admin and teachers see all teachers (no additional filters)
    // When getAll=true, also no filters regardless of role

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
      where.classes = { some: { id: classId } };
    }

    const [teachers, total] = await prisma.$transaction([
      prisma.teacher.findMany({
        where,
        include: {
          subjects: true,
          classes: true,
        },
        take: ITEM_PER_PAGE,
        skip: (page - 1) * ITEM_PER_PAGE,
        orderBy: { name: "asc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    console.log(`📊 Teachers API: returning ${teachers.length} teachers (total: ${total}, getAll: ${getAll})`);

    return NextResponse.json({
      teachers,
      total,
      page,
      totalPages: Math.ceil(total / ITEM_PER_PAGE),
    });
  } catch (error) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// CREATE teacher
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      username,
      name,
      surname,
      email,
      phone,
      address,
      sex,
      birthday,
      password,
      subjects,
    } = body;

    // Validate required fields
    if (!username || !name || !surname || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate email/username
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingTeacher) {
      return NextResponse.json(
        { error: "Email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create teacher
    const newTeacher = await prisma.teacher.create({
      data: {
        username,
        name,
        surname,
        email,
        phone,
        address,
        sex,
        birthday: new Date(birthday),
        password: hashedPassword,
      },
      include: {
        subjects: true,
        classes: {
          include: {
            grade: true,
          },
        },
      },
    });

    // Connect subjects if provided
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      await prisma.teacher.update({
        where: { id: newTeacher.id },
        data: {
          subjects: {
            connect: subjects.map((subjectId: string) => ({
              id: parseInt(subjectId),
            })),
          },
        },
      });
    }

    return NextResponse.json(
      {
        message: "Teacher created successfully",
        teacher: newTeacher,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Teacher CREATE error:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
