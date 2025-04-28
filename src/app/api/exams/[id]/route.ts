import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET single exam
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exam = await prisma.exam.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        examType: true,
        Subject: true,
        Teacher: true,
        Lesson: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

// PUT update exam
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const exam = await prisma.exam.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        duration: Math.round(
          (new Date(data.endTime).getTime() -
            new Date(data.startTime).getTime()) /
            (1000 * 60)
        ).toString(),
        venue: data.venue,
        examType: {
          connect: { id: parseInt(data.examTypeId) },
        },
        Subject: {
          connect: data.subjectId
            ? { id: parseInt(data.subjectId) }
            : undefined,
        },
        Teacher: {
          connect: data.teacherId ? { id: data.teacherId } : undefined,
        },
        Lesson: {
          connect: data.lessonId ? { id: parseInt(data.lessonId) } : undefined,
        },
      },
      include: {
        examType: true,
        Subject: true,
        Teacher: true,
        Lesson: true,
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

// DELETE exam
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Parse the ID to ensure it's a valid number
    const examId = parseInt(id, 10);
    if (isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    // Check if the exam exists before attempting to delete
    const existingExam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!existingExam) {
      console.error("Exam not found for deletion, ID:", examId);
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    console.log("DELETE request received for exam ID:", id);

    // Delete the exam from the database
    await prisma.exam.delete({
      where: { id: examId },
    });

    return NextResponse.json(
      { message: "Exam deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
