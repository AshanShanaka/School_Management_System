import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[GENERATIONS API] Starting request...");
    const user = await getCurrentUser();

    if (!user) {
      console.log("[GENERATIONS API] No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[GENERATIONS API] User:", user.role, user.id);

    let generations;

    if (user.role === "admin") {
      console.log("[GENERATIONS API] Fetching all generations for admin");
      // Admin can see all generations
      generations = await prisma.reportCardGeneration.findMany({
        include: {
          exam: {
            include: {
              examType: true,
              grade: true,
            },
          },
          class: {
            include: {
              grade: true,
            },
          },
          teacher: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          reportCards: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: [
          { examYear: "desc" },
          { examTerm: "desc" },
          { createdAt: "desc" },
        ],
        take: 100,
      });
    } else if (user.role === "teacher") {
      console.log("[GENERATIONS API] Fetching generations for teacher:", user.id);
      // Teachers see only their generations
      generations = await prisma.reportCardGeneration.findMany({
        where: {
          teacherId: user.id,
        },
        include: {
          exam: {
            include: {
              examType: true,
              grade: true,
            },
          },
          class: {
            include: {
              grade: true,
            },
          },
          teacher: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          reportCards: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: [
          { examYear: "desc" },
          { examTerm: "desc" },
          { createdAt: "desc" },
        ],
        take: 100,
      });
    } else {
      console.log("[GENERATIONS API] Access denied for role:", user.role);
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    console.log("[GENERATIONS API] Found", generations.length, "generations");

    return NextResponse.json(
      {
        generations,
        count: generations.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GENERATIONS API] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch report card generations",
      },
      { status: 500 }
    );
  }
}
