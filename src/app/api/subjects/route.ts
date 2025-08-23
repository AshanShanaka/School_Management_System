import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all subjects with their teachers - no need for complex class assignments
    const subjects = await prisma.subject.findMany({
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
