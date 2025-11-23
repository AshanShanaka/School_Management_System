import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * API Route: /api/teacher/dashboard (GET)
 * Get comprehensive teacher dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Access denied. Teacher role required." },
        { status: 403 }
      );
    }

    // Get teacher with their classes, subjects, and lessons
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: {
        lessons: {
          include: {
            subject: true,
            class: {
              include: {
                grade: true,
                _count: {
                  select: { students: true },
                },
              },
            },
          },
        },
        subjects: true,
        classes: {
          include: {
            grade: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Get all unique classes and students
    const classIds = teacher.classes.map((c) => c.id);
    const lessonClassIds = teacher.lessons.map((l) => l.classId).filter(Boolean) as string[];
    const allClassIds = [...new Set([...classIds, ...lessonClassIds])];

    const students = await prisma.student.findMany({
      where: {
        classId: { in: allClassIds },
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    // Get today's lessons
    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

    const todayLessons = teacher.lessons.filter(
      (lesson) => lesson.day?.toLowerCase() === dayName.toLowerCase()
    );

    // Get upcoming exams for teacher's lessons
    const upcomingExams = await prisma.exam.findMany({
      where: {
        lesson: {
          teacherId: teacher.id,
        },
        startTime: {
          gte: new Date(),
        },
      },
      include: {
        lesson: {
          include: {
            subject: true,
            class: {
              include: {
                grade: true,
              },
            },
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
            classId: { in: allClassIds },
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

    // Get attendance stats for today
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        lesson: {
          teacherId: teacher.id,
        },
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const presentCount = todayAttendance.filter((a) => a.present).length;
    const attendanceRate =
      todayAttendance.length > 0
        ? Math.round((presentCount / todayAttendance.length) * 100)
        : 0;

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        surname: teacher.surname,
        email: teacher.email,
        phone: teacher.phone,
      },
      stats: {
        classes: teacher.classes.length,
        students: students.length,
        subjects: teacher.subjects.length,
        lessons: teacher.lessons.length,
        supervised: teacher.classes.filter((c) => c.supervisorId === teacher.id)
          .length,
        todayAttendanceRate: attendanceRate,
      },
      classes: teacher.classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        capacity: cls.capacity,
        studentCount: cls._count?.students || 0,
        grade: cls.grade
          ? {
              id: cls.grade.id,
              level: cls.grade.level,
            }
          : null,
      })),
      subjects: teacher.subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
      })),
      lessons: teacher.lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
        day: lesson.day,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        classId: lesson.classId, // Add classId for easier access
        subjectId: lesson.subjectId, // Add subjectId for easier access
        subject: lesson.subject
          ? {
              id: lesson.subject.id,
              name: lesson.subject.name,
            }
          : null,
        class: lesson.class
          ? {
              id: lesson.class.id,
              name: lesson.class.name,
              grade: lesson.class.grade
                ? {
                    id: lesson.class.grade.id,
                    level: lesson.class.grade.level,
                  }
                : null,
            }
          : null,
      })),
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        surname: student.surname,
        email: student.email,
        class: student.class
          ? {
              id: student.class.id,
              name: student.class.name,
              grade: student.class.grade
                ? {
                    id: student.class.grade.id,
                    level: student.class.grade.level,
                  }
                : null,
            }
          : null,
      })),
      todayLessons: todayLessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        day: lesson.day,
        subject: lesson.subject
          ? {
              id: lesson.subject.id,
              name: lesson.subject.name,
            }
          : null,
        class: lesson.class
          ? {
              id: lesson.class.id,
              name: lesson.class.name,
            }
          : null,
      })),
      upcomingExams: upcomingExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        startTime: exam.startTime,
        endTime: exam.endTime,
        description: exam.description,
        subject: exam.lesson.subject
          ? {
              id: exam.lesson.subject.id,
              name: exam.lesson.subject.name,
            }
          : null,
        class: exam.lesson.class
          ? {
              id: exam.lesson.class.id,
              name: exam.lesson.class.name,
              grade: exam.lesson.class.grade
                ? {
                    id: exam.lesson.class.grade.id,
                    level: exam.lesson.class.grade.level,
                  }
                : null,
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
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
