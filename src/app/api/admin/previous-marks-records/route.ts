import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const gradeId = searchParams.get("grade");
    const classId = searchParams.get("class");
    const year = searchParams.get("year");
    const term = searchParams.get("term");
    const search = searchParams.get("search");

    // Build query - ONLY show Grade 9 & 10 historical marks
    const query: Prisma.ExamWhereInput = {
      grade: {
        level: {
          in: [9, 10] // ONLY Grade 9 and 10 historical marks
        }
      }
    };

    if (gradeId) {
      query.gradeId = parseInt(gradeId);
    }
    if (classId) {
      query.classId = parseInt(classId);
    }
    if (year) {
      query.year = parseInt(year);
    }
    if (term) {
      query.term = parseInt(term);
    }
    if (search) {
      query.title = { contains: search, mode: "insensitive" };
    }

    // Get data and count
    const [exams, count] = await prisma.$transaction([
      prisma.exam.findMany({
        where: query,
        include: {
          grade: true,
          examType: true,
          examSubjects: {
            include: {
              subject: true,
            },
          },
          _count: {
            select: {
              results: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: [
          { grade: { level: "asc" } }, // Sort by grade first (9 then 10)
          { createdAt: "desc" }, // Then by creation date
        ],
      }),
      prisma.exam.count({ where: query }),
    ]);

    // Get unique student count for each exam
    const data = await Promise.all(
      exams.map(async (exam) => {
        const uniqueStudents = await prisma.examResult.findMany({
          where: { examId: exam.id },
          distinct: ['studentId'],
          select: { studentId: true },
        });
        
        return {
          ...exam,
          uniqueStudentCount: uniqueStudents.length,
        };
      })
    );

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error("Error fetching previous marks records:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
