import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get historical grades (Grade 9 and 10)
    const historicalGrades = await prisma.grade.findMany({
      where: {
        level: {
          in: [9, 10],
        },
      },
    });

    const historicalGradeIds = historicalGrades.map((g) => g.id);

    // Get all classes that have students with results in historical exams
    const classes = await prisma.class.findMany({
      where: {
        students: {
          some: {
            results: {
              some: {
                examSubject: {
                  exam: {
                    gradeId: {
                      in: historicalGradeIds,
                    },
                  },
                },
              },
            },
          },
        },
      },
      include: {
        grade: true,
        _count: {
          select: {
            students: true,
          },
        },
        students: {
          include: {
            results: {
              where: {
                examSubject: {
                  exam: {
                    gradeId: {
                      in: historicalGradeIds,
                    },
                  },
                },
              },
              include: {
                examSubject: {
                  include: {
                    subject: true,
                    exam: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate statistics for each class
    const classesWithStats = classes.map((cls) => {
      const termsSet = new Set<string>();
      const studentAverages: number[] = [];

      cls.students.forEach((student) => {
        student.results.forEach((result) => {
          termsSet.add(result.examSubject.exam.title);
        });

        // Calculate student average
        if (student.results.length > 0) {
          const sum = student.results.reduce(
            (acc, result) => acc + (result.marks || 0),
            0
          );
          studentAverages.push(sum / student.results.length);
        }
      });

      const classAverage =
        studentAverages.length > 0
          ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length
          : 0;

      return {
        id: cls.id,
        name: cls.name,
        gradeLevel: cls.grade.level,
        studentsCount: cls._count.students,
        termsImported: termsSet.size,
        classAverage,
      };
    });

    // Filter out classes with no historical data
    const filteredClasses = classesWithStats.filter(
      (cls) => cls.termsImported > 0
    );

    return NextResponse.json(filteredClasses);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
