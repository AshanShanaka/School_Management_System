import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/timetables/user - Get timetables relevant to the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let timetables: any[] = [];

    if (user.role === "admin") {
      // Admin can see all timetables
      timetables = await prisma.timetable.findMany({
        include: {
          class: {
            include: {
              grade: true,
            },
          },
          slots: {
            include: {
              subject: true,
              teacher: true,
            },
            orderBy: [{ day: "asc" }, { period: "asc" }],
          },
        },
        orderBy: [
          { class: { grade: { level: "asc" } } },
          { class: { name: "asc" } },
        ],
      });
    } else if (user.role === "student") {
      // Students can see their class timetable
      let student;
      
      // Check if this is a hardcoded test user
      if (user.id === "student-temp-id") {
        // For test student, get all available timetables
        timetables = await prisma.timetable.findMany({
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            slots: {
              include: {
                subject: true,
                teacher: true,
              },
              orderBy: [{ day: "asc" }, { period: "asc" }],
            },
          },
          orderBy: [
            { class: { grade: { level: "asc" } } },
            { class: { name: "asc" } },
          ],
        });
        
      } else {
        // For real database users
        student = await prisma.student.findUnique({
          where: { id: user.id },
          include: { class: true },
        });

        if (student?.classId) {
          timetables = await prisma.timetable.findMany({
            where: { classId: student.classId },
            include: {
              class: {
                include: {
                  grade: true,
                },
              },
              slots: {
                include: {
                  subject: true,
                  teacher: true,
                },
                orderBy: [{ day: "asc" }, { period: "asc" }],
              },
            },
          });
        }
      }
    } else if (user.role === "parent") {
      // Parents can see their children's class timetables
      let classIds: number[] = [];
      
      // Check if this is a hardcoded test user
      if (user.id === "parent-temp-id") {
        // For test parent, get all available timetables
        timetables = await prisma.timetable.findMany({
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            slots: {
              include: {
                subject: true,
                teacher: true,
              },
              orderBy: [{ day: "asc" }, { period: "asc" }],
            },
          },
          orderBy: [
            { class: { grade: { level: "asc" } } },
            { class: { name: "asc" } },
          ],
        });
        
      } else {
        // For real database users
        const parent = await prisma.parent.findUnique({
          where: { id: user.id },
        });

        const children = await prisma.student.findMany({
          where: { parentId: parent?.id },
          include: { class: true },
        });

        const classIds = children.map(child => child.classId).filter(Boolean) as number[];
        
        if (classIds.length > 0) {
          timetables = await prisma.timetable.findMany({
            where: { classId: { in: classIds } },
            include: {
              class: {
                include: {
                  grade: true,
                },
              },
              slots: {
                include: {
                  subject: true,
                  teacher: true,
                },
                orderBy: [{ day: "asc" }, { period: "asc" }],
              },
            },
            orderBy: [
              { class: { grade: { level: "asc" } } },
              { class: { name: "asc" } },
            ],
          });
        }
      }
    } else if (user.role === "teacher") {
      // Teachers can see timetables for classes they teach
      let classIds: number[] = [];
      
      // Check if this is a hardcoded test user
      if (user.id === "teacher-temp-id" || user.id === "teacher-temp-id-2") {
        // For test teacher, get all available timetables
        timetables = await prisma.timetable.findMany({
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            slots: {
              include: {
                subject: true,
                teacher: true,
              },
              orderBy: [{ day: "asc" }, { period: "asc" }],
            },
          },
          orderBy: [
            { class: { grade: { level: "asc" } } },
            { class: { name: "asc" } },
          ],
        });
        
      } else {
        // For real database users
        const teacher = await prisma.teacher.findUnique({
          where: { id: user.id },
        });

        if (teacher) {
          const assignments = await prisma.subjectAssignment.findMany({
            where: { teacherId: teacher.id },
            select: { classId: true },
          });

          const classIds = assignments.map(assignment => assignment.classId).filter(Boolean) as number[];

          if (classIds.length > 0) {
            // Teacher has specific assignments, show only those timetables
            timetables = await prisma.timetable.findMany({
              where: { classId: { in: classIds } },
              include: {
                class: {
                  include: {
                    grade: true,
                  },
                },
                slots: {
                  include: {
                    subject: true,
                    teacher: true,
                  },
                  orderBy: [{ day: "asc" }, { period: "asc" }],
                },
              },
              orderBy: [
                { class: { grade: { level: "asc" } } },
                { class: { name: "asc" } },
              ],
            });
          } else {
            // Teacher has no specific assignments, show all timetables (fallback)
            timetables = await prisma.timetable.findMany({
              include: {
                class: {
                  include: {
                    grade: true,
                  },
                },
                slots: {
                  include: {
                    subject: true,
                    teacher: true,
                  },
                  orderBy: [{ day: "asc" }, { period: "asc" }],
                },
              },
              orderBy: [
                { class: { grade: { level: "asc" } } },
                { class: { name: "asc" } },
              ],
            });
          }
        }
      }
    }

    return NextResponse.json(timetables);
  } catch (error) {
    console.error("Error fetching user timetables:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
