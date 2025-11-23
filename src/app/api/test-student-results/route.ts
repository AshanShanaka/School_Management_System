import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("=== Test Student Results API ===");
    console.log("User:", user.id, user.role);

    if (user.role !== "student") {
      return NextResponse.json({ error: "Not a student" }, { status: 403 });
    }

    // Get exam summaries
    const summaries = await prisma.examSummary.findMany({
      where: { studentId: user.id },
      include: {
        exam: true,
        student: {
          include: {
            class: true
          }
        }
      }
    });

    // Get exam results
    const results = await prisma.examResult.findMany({
      where: { studentId: user.id },
      include: {
        exam: true,
        examSubject: {
          include: {
            subject: true
          }
        }
      }
    });

    console.log("Summaries found:", summaries.length);
    console.log("Results found:", results.length);

    return NextResponse.json({
      userId: user.id,
      username: user.username,
      summaries: summaries.length,
      results: results.length,
      data: {
        summaries,
        results
      }
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
