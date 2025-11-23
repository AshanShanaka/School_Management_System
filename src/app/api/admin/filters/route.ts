import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch grades and classes for Grade 9 and 10
    const [grades, classes] = await Promise.all([
      prisma.grade.findMany({
        where: {
          level: {
            in: [9, 10]
          }
        },
        orderBy: {
          level: 'asc'
        }
      }),
      prisma.class.findMany({
        where: {
          grade: {
            level: {
              in: [9, 10]
            }
          }
        },
        include: {
          grade: true
        },
        orderBy: [
          { grade: { level: 'asc' } },
          { name: 'asc' }
        ]
      })
    ]);

    return NextResponse.json({ grades, classes });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
