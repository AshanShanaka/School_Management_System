import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch only active classes with their grade information
    const activeClasses = await prisma.class.findMany({
      where: {
        // Add any additional filters for "active" classes
        // For example, you might have an isActive field or check enrollment
      },
      include: {
        grade: true,
        _count: {
          select: {
            students: true, // Count of students in the class
          },
        },
      },
      orderBy: [
        { grade: { level: "asc" } },
        { name: "asc" },
      ],
    });

    // Filter out classes with no students if you want only classes with active enrollment
    const classesWithStudents = activeClasses.filter(
      (cls) => cls._count.students > 0
    );

    return NextResponse.json(classesWithStudents);
  } catch (error) {
    console.error("Error fetching active classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch active classes" },
      { status: 500 }
    );
  }
}
