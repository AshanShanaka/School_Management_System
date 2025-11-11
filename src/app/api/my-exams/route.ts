import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTeacherExams, getStudentExams, getParentExams, getPublishedExams } from "@/lib/examService";

/**
 * GET /api/my-exams
 * Get exams based on user role:
 * - Admin: All published exams
 * - Teacher: Exams where they teach subjects
 * - Student: Exams for their grade/class
 * - Parent: Exams for all their children
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let exams: any[] = [];

    switch (user.role) {
      case "admin":
        // Admin sees all published exams
        exams = await getPublishedExams();
        break;

      case "teacher":
        // Teacher sees exams for subjects they teach
        exams = await getTeacherExams(user.id);
        break;

      case "student":
        // Student sees exams for their grade/class
        exams = await getStudentExams(user.id);
        break;

      case "parent":
        // Parent sees exams for all their children
        exams = await getParentExams(user.id);
        break;

      default:
        return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      exams,
    });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch exams" },
      { status: 500 }
    );
  }
}
