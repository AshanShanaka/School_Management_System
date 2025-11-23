import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const examId = parseInt(params.id);

    // Delete the exam and all related data
    await prisma.$transaction([
      // Delete exam results first
      prisma.examResult.deleteMany({
        where: { examId }
      }),
      // Delete exam subjects
      prisma.examSubject.deleteMany({
        where: { examId }
      }),
      // Delete the exam
      prisma.exam.delete({
        where: { id: examId }
      })
    ]);

    return NextResponse.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
