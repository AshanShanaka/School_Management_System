import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateReportCards,
  saveReportCards,
} from "@/lib/services/reportCardService";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only class teachers and admins can generate report cards
    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only class teachers and admins can generate report cards" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { examId, classId } = body;

    if (!examId || !classId) {
      return NextResponse.json(
        { error: "Exam ID and Class ID are required" },
        { status: 400 }
      );
    }

    // If user is a teacher, verify they are the class teacher
    if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        include: {
          classes: true,
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found" },
          { status: 404 }
        );
      }

      // Check if teacher is class teacher of this class
      const isClassTeacher = teacher.classes.some(
        (cls) => cls.id === Number(classId)
      );

      if (!isClassTeacher) {
        return NextResponse.json(
          { error: "You can only generate report cards for your assigned class" },
          { status: 403 }
        );
      }
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: Number(examId) },
      include: {
        grade: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Verify class exists
    const classData = await prisma.class.findUnique({
      where: { id: Number(classId) },
      include: {
        grade: true,
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify exam is for the same grade as the class
    if (exam.gradeId !== classData.gradeId) {
      return NextResponse.json(
        { error: "Exam grade does not match class grade" },
        { status: 400 }
      );
    }

    console.log(`Generating report cards for Exam ${examId}, Class ${classId}`);

    // Generate report cards
    const reportCardsData = await generateReportCards(
      Number(examId),
      Number(classId)
    );

    if (reportCardsData.length === 0) {
      return NextResponse.json(
        {
          error:
            "No exam results found. Please ensure marks have been entered for this exam.",
        },
        { status: 404 }
      );
    }

    // Save to database with generation label
    const { reportCards: savedReportCards, generation } = await saveReportCards(
      reportCardsData,
      Number(examId),
      Number(classId),
      user.id
    );

    console.log(`Generated ${reportCardsData.length} report cards successfully`);
    console.log(`Generation Label: ${generation.label}`);

    return NextResponse.json(
      {
        message: `Successfully generated ${reportCardsData.length} report cards`,
        count: reportCardsData.length,
        reportCards: reportCardsData,
        generation: {
          id: generation.id,
          label: generation.label,
          examTitle: generation.examTitle,
          className: generation.className,
          totalStudents: generation.totalStudents,
          averagePercentage: generation.averagePercentage,
          generatedAt: generation.generatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error generating report cards:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate report cards",
      },
      { status: 500 }
    );
  }
}
