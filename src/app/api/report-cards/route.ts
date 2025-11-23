import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStudentReportCard } from "@/lib/services/reportCardService";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const generationId = searchParams.get("generationId");

    // If generationId is provided, fetch report cards for that generation
    if (generationId) {
      const reportCards = await prisma.reportCard.findMany({
        where: {
          generationId: generationId,
        },
        include: {
          exam: {
            include: {
              grade: true,
              examType: true,
            },
          },
          class: {
            include: {
              grade: true,
            },
          },
          student: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
            },
          },
          generation: true,
        },
        orderBy: {
          classRank: "asc",
        },
      });

      return NextResponse.json(
        {
          reportCards,
          count: reportCards.length,
        },
        { status: 200 }
      );
    }

    // Admin/Principal can view any report card
    if (user.role === "admin") {
      if (examId && classId) {
        // Get all report cards for an exam and class
        const reportCards = await prisma.reportCard.findMany({
          where: {
            examId: Number(examId),
            student: {
              classId: Number(classId),
            },
          },
          include: {
            exam: {
              include: {
                grade: true,
                examType: true,
              },
            },
            student: {
              include: {
                class: {
                  include: {
                    grade: true,
                  },
                },
              },
            },
          },
          orderBy: {
            classRank: "asc",
          },
        });

        return NextResponse.json({ reportCards }, { status: 200 });
      }

      if (examId && studentId) {
        // Get specific student's report card
        const reportCard = await prisma.reportCard.findFirst({
          where: {
            examId: Number(examId),
            studentId: studentId,
          },
          include: {
            exam: {
              include: {
                grade: true,
                examType: true,
              },
            },
            student: {
              include: {
                class: {
                  include: {
                    grade: true,
                  },
                },
              },
            },
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        });

        if (!reportCard) {
          return NextResponse.json(
            { error: "Report card not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({ reportCard }, { status: 200 });
      }
    }

    // Class teachers can view their class report cards
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

      if (examId && classId) {
        // Verify teacher is class teacher
        const isClassTeacher = teacher.classes.some(
          (cls) => cls.id === Number(classId)
        );

        if (!isClassTeacher) {
          return NextResponse.json(
            { error: "You can only view report cards for your assigned class" },
            { status: 403 }
          );
        }

        const reportCards = await prisma.reportCard.findMany({
          where: {
            examId: Number(examId),
            student: {
              classId: Number(classId),
            },
          },
          include: {
            exam: {
              include: {
                grade: true,
                examType: true,
              },
            },
            student: {
              include: {
                class: {
                  include: {
                    grade: true,
                  },
                },
              },
            },
          },
          orderBy: {
            classRank: "asc",
          },
        });

        return NextResponse.json({ reportCards }, { status: 200 });
      }
    }

    // Students can only view their own report cards
    if (user.role === "student") {
      if (!examId) {
        return NextResponse.json(
          { error: "Exam ID is required" },
          { status: 400 }
        );
      }

      const reportCardData = await getStudentReportCard(
        Number(examId),
        user.id
      );

      if (!reportCardData) {
        return NextResponse.json(
          { error: "Report card not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ reportCard: reportCardData }, { status: 200 });
    }

    // Parents can view their children's report cards
    if (user.role === "parent") {
      const parent = await prisma.parent.findUnique({
        where: { id: user.id },
        include: {
          students: true,
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent not found" },
          { status: 404 }
        );
      }

      if (!studentId) {
        return NextResponse.json(
          { error: "Student ID is required for parents" },
          { status: 400 }
        );
      }

      // Verify student belongs to parent
      const isParentOfStudent = parent.students.some((s) => s.id === studentId);

      if (!isParentOfStudent) {
        return NextResponse.json(
          { error: "You can only view your children's report cards" },
          { status: 403 }
        );
      }

      if (!examId) {
        return NextResponse.json(
          { error: "Exam ID is required" },
          { status: 400 }
        );
      }

      const reportCardData = await getStudentReportCard(
        Number(examId),
        studentId
      );

      if (!reportCardData) {
        return NextResponse.json(
          { error: "Report card not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ reportCard: reportCardData }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid role or missing parameters" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error fetching report cards:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch report cards",
      },
      { status: 500 }
    );
  }
}
