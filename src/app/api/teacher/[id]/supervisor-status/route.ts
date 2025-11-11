import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;

    // Check if the teacher supervises any classes
    const supervisedClassesCount = await prisma.class.count({
      where: {
        supervisorId: teacherId,
      },
    });

    const isClassSupervisor = supervisedClassesCount > 0;

    return NextResponse.json({
      isClassSupervisor,
      supervisedClassesCount,
    });
  } catch (error) {
    console.error("Error checking supervisor status:", error);
    return NextResponse.json(
      { error: "Failed to check supervisor status" },
      { status: 500 }
    );
  }
}
