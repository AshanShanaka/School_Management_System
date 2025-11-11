import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStudentsForMarksEntry, saveStudentMarks } from "@/lib/examService";

/**
 * GET /api/exam-marks-entry?examId=X&classId=Y&subjectId=Z
 * Get students list for marks entry
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { error: "Unauthorized. Teacher access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    if (!examId || !classId || !subjectId) {
      return NextResponse.json(
        { error: "Missing required parameters: examId, classId, subjectId" },
        { status: 400 }
      );
    }

    const data = await getStudentsForMarksEntry(
      parseInt(examId),
      parseInt(classId),
      parseInt(subjectId)
    );

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("Error fetching students for marks entry:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch students" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exam-marks-entry
 * Save marks for students
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { error: "Unauthorized. Teacher access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { examId, examSubjectId, marks } = body;

    if (!examId || !examSubjectId || !marks || !Array.isArray(marks)) {
      return NextResponse.json(
        { error: "Missing required fields: examId, examSubjectId, marks (array)" },
        { status: 400 }
      );
    }

    // Validate marks array
    for (const entry of marks) {
      if (!entry.studentId || (entry.marks === null && !entry.isAbsent)) {
        return NextResponse.json(
          { error: "Each entry must have studentId and either marks or isAbsent=true" },
          { status: 400 }
        );
      }
    }

    const results = await saveStudentMarks(
      parseInt(examId),
      parseInt(examSubjectId),
      user.id,
      marks
    );

    return NextResponse.json({
      success: true,
      message: `Marks saved successfully for ${results.length} students`,
      results,
    });
  } catch (error: any) {
    console.error("Error saving marks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save marks" },
      { status: 500 }
    );
  }
}
