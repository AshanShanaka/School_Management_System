import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * API Route: /api/parent/dashboard (GET)
 * Get parent dashboard data with children information
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "parent") {
      return NextResponse.json(
        { error: "Access denied. Parent role required." },
        { status: 403 }
      );
    }

    // Get parent with children
    const parent = await prisma.parent.findUnique({
      where: { id: user.id },
      include: {
        students: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Get stats for all children
    const childrenIds = parent.students.map((s) => s.id);

    // Get recent attendance for all children
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        studentId: { in: childrenIds },
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      include: {
        lesson: {
          include: {
            subject: true,
          },
        },
        student: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 50,
    });

    // Get recent exam marks for all children
    const recentMarks = await prisma.result.findMany({
      where: {
        studentId: { in: childrenIds },
      },
      include: {
        exam: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
          },
        },
        student: true,
      },
      orderBy: {
        score: "desc",
      },
      take: 100,
    });

    // Calculate attendance statistics per child
    const childrenStats = await Promise.all(
      parent.students.map(async (student) => {
        const attendanceCount = await prisma.attendance.count({
          where: {
            studentId: student.id,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        });

        const presentCount = await prisma.attendance.count({
          where: {
            studentId: student.id,
            present: true,
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        });

        const attendanceRate =
          attendanceCount > 0
            ? Math.round((presentCount / attendanceCount) * 100)
            : 0;

        // Get average marks
        const marks = await prisma.result.findMany({
          where: {
            studentId: student.id,
          },
        });

        const averageMark =
          marks.length > 0
            ? Math.round(
                marks.reduce((sum, m) => sum + m.score, 0) / marks.length
              )
            : 0;

        // Get subject count
        const subjects = await prisma.lesson.findMany({
          where: {
            classId: student.classId,
          },
          select: {
            subjectId: true,
          },
          distinct: ["subjectId"],
        });

        return {
          studentId: student.id,
          studentName: `${student.name} ${student.surname}`,
          className: student.class?.name || "N/A",
          grade: student.class?.grade?.level || "N/A",
          attendanceRate,
          averageMark,
          totalAttendance: attendanceCount,
          presentDays: presentCount,
          totalSubjects: subjects.length,
          totalMarks: marks.length,
        };
      })
    );

    // Get upcoming exams for children's classes
    const upcomingExams = await prisma.exam.findMany({
      where: {
        lesson: {
          classId: {
            in: parent.students
              .map((s) => s.classId)
              .filter((id): id is string => id !== null),
          },
        },
        startTime: {
          gte: new Date(),
        },
      },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 10,
    });

    // Get recent announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          {
            classId: {
              in: parent.students
                .map((s) => s.classId)
                .filter((id): id is string => id !== null),
            },
          },
          {
            classId: null, // School-wide announcements
          },
        ],
      },
      orderBy: {
        date: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        surname: parent.surname,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
      },
      children: parent.students.map((student) => ({
        id: student.id,
        name: student.name,
        surname: student.surname,
        email: student.email,
        phone: student.phone,
        bloodType: student.bloodType,
        birthday: student.birthday,
        sex: student.sex,
        img: student.img,
        class: student.class
          ? {
              id: student.class.id,
              name: student.class.name,
              capacity: student.class.capacity,
              grade: student.class.grade
                ? {
                    id: student.class.grade.id,
                    level: student.class.grade.level,
                  }
                : null,
            }
          : null,
      })),
      stats: childrenStats,
      recentAttendance: recentAttendance.map((att) => ({
        id: att.id,
        date: att.date,
        present: att.present,
        student: {
          id: att.student.id,
          name: att.student.name,
          surname: att.student.surname,
        },
        lesson: att.lesson
          ? {
              id: att.lesson.id,
              name: att.lesson.name,
              subject: att.lesson.subject
                ? {
                    id: att.lesson.subject.id,
                    name: att.lesson.subject.name,
                  }
                : null,
            }
          : null,
      })),
      recentMarks: recentMarks.map((mark) => ({
        id: mark.id,
        score: mark.score,
        student: {
          id: mark.student.id,
          name: mark.student.name,
          surname: mark.student.surname,
        },
        exam: mark.exam
          ? {
              id: mark.exam.id,
              title: mark.exam.title,
              startTime: mark.exam.startTime,
              subject: mark.exam.lesson.subject
                ? {
                    id: mark.exam.lesson.subject.id,
                    name: mark.exam.lesson.subject.name,
                  }
                : null,
            }
          : null,
        assignment: mark.assignment
          ? {
              id: mark.assignment.id,
              title: mark.assignment.title,
              dueDate: mark.assignment.dueDate,
              subject: mark.assignment.lesson.subject
                ? {
                    id: mark.assignment.lesson.subject.id,
                    name: mark.assignment.lesson.subject.name,
                  }
                : null,
            }
          : null,
      })),
      upcomingExams: upcomingExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        startTime: exam.startTime,
        endTime: exam.endTime,
        description: exam.description,
        class: exam.lesson.class
          ? {
              id: exam.lesson.class.id,
              name: exam.lesson.class.name,
            }
          : null,
        subject: exam.lesson.subject
          ? {
              id: exam.lesson.subject.id,
              name: exam.lesson.subject.name,
            }
          : null,
      })),
      announcements: announcements.map((ann) => ({
        id: ann.id,
        title: ann.title,
        description: ann.description,
        date: ann.date,
      })),
    });
  } catch (error: any) {
    console.error("Parent dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
