import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createExamTimetable, getPublishedExams } from "@/lib/examService";
import { ExamTypeEnum } from "@prisma/client";

/**
 * GET /api/exam-timetable
 * Get all published exam timetables
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("gradeId");
    const classId = searchParams.get("classId");
    const year = searchParams.get("year");
    const term = searchParams.get("term");

    const filters: any = {};
    if (gradeId) filters.gradeId = parseInt(gradeId);
    if (classId) filters.classId = parseInt(classId);
    if (year) filters.year = parseInt(year);
    if (term) filters.term = parseInt(term);

    const exams = await getPublishedExams(filters);

    return NextResponse.json({
      success: true,
      exams,
    });
  } catch (error: any) {
    console.error("Error fetching exam timetables:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch exam timetables" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exam-timetable
 * Create/update exam timetable (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      examType,
      gradeId,
      classId,
      term,
      year,
      subjects,
      marksEntryDeadline,
      reviewDeadline,
    } = body;

    // Validation
    if (!title || !examType || !gradeId || !term || !year || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: title, examType, gradeId, term, year, subjects" },
        { status: 400 }
      );
    }

    // Validate exam type
    if (!Object.values(ExamTypeEnum).includes(examType)) {
      return NextResponse.json(
        { error: `Invalid exam type. Must be one of: ${Object.values(ExamTypeEnum).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate subjects array
    for (const sub of subjects) {
      if (!sub.subjectId || !sub.examDate || !sub.startTime || !sub.endTime) {
        return NextResponse.json(
          { error: "Each subject must have subjectId, examDate, startTime, and endTime" },
          { status: 400 }
        );
      }
    }

    const exam = await createExamTimetable({
      title,
      examTypeEnum: examType as ExamTypeEnum,
      gradeId: parseInt(gradeId),
      classId: classId ? parseInt(classId) : undefined,
      term: parseInt(term),
      year: parseInt(year),
      subjects: subjects.map((sub: any) => ({
        subjectId: parseInt(sub.subjectId),
        teacherId: sub.teacherId || undefined,
        examDate: new Date(sub.examDate),
        startTime: sub.startTime,
        endTime: sub.endTime,
        maxMarks: sub.maxMarks || 100,
      })),
      marksEntryDeadline: marksEntryDeadline ? new Date(marksEntryDeadline) : undefined,
      reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Exam timetable created/updated successfully",
      exam,
    });
  } catch (error: any) {
    console.error("Error creating exam timetable:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create exam timetable" },
      { status: 500 }
    );
  }
}
