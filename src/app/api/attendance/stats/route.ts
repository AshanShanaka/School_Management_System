import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const role = user?.role;
  const userId = user?.id;

  if (!role || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (role === "admin") {
      // Get overall attendance statistics for admin
      const totalStudents = await prisma.student.count();

      // Get today's attendance records
      const todayAttendance = await prisma.attendance.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
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
      });

      // Calculate overall stats
      const presentToday = todayAttendance.filter((a) => a.present).length;
      const absentToday = todayAttendance.filter((a) => !a.present).length;
      const lateToday = todayAttendance.filter(
        (a) => a.present && new Date(a.date).getHours() > 8
      ).length;
      const attendanceRate =
        totalStudents > 0 ? (presentToday / totalStudents) * 100 : 0;

      // Get class-wise statistics
      const classes = await prisma.class.findMany({
        include: {
          grade: true,
          _count: {
            select: { students: true },
          },
        },
      });

      const classStats = await Promise.all(
        classes.map(async (classItem) => {
          const classStudents = await prisma.student.count({
            where: { classId: classItem.id },
          });

          const classAttendance = todayAttendance.filter(
            (a) => a.student.classId === classItem.id
          );

          const classPresent = classAttendance.filter((a) => a.present).length;
          const classAbsent = classAttendance.filter((a) => !a.present).length;
          const classLate = classAttendance.filter(
            (a) => a.present && new Date(a.date).getHours() > 8
          ).length;
          const classRate =
            classStudents > 0 ? (classPresent / classStudents) * 100 : 0;

          return {
            classId: classItem.id,
            className: classItem.name,
            gradeLevel: classItem.grade.level,
            totalStudents: classStudents,
            presentToday: classPresent,
            absentToday: classAbsent,
            lateToday: classLate,
            attendanceRate: classRate,
          };
        })
      );

      return NextResponse.json({
        overallStats: {
          totalStudents,
          presentToday,
          absentToday,
          lateToday,
          attendanceRate,
        },
        classStats,
      });
    } else if (role === "student") {
      // Get student's own attendance
      const student = await prisma.student.findUnique({
        where: { id: user?.id as string },
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      const studentAttendance = await prisma.attendance.findMany({
        where: {
          studentId: user?.id as string,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const isPresent = studentAttendance.some((a) => a.present);
      const isLate = studentAttendance.some(
        (a) => a.present && new Date(a.date).getHours() > 8
      );

      // Get monthly attendance stats
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthAttendance = await prisma.attendance.findMany({
        where: {
          studentId: user?.id as string,
          date: {
            gte: monthStart,
            lt: tomorrow,
          },
        },
      });

      const monthPresent = monthAttendance.filter((a) => a.present).length;
      const monthTotal = monthAttendance.length;
      const monthlyRate =
        monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0;

      return NextResponse.json({
        studentStats: {
          presentToday: isPresent ? 1 : 0,
          absentToday: isPresent ? 0 : 1,
          lateToday: isLate ? 1 : 0,
          monthlyAttendanceRate: monthlyRate,
          className: `${student.class.grade.level}-${student.class.name}`,
        },
      });
    } else if (role === "parent") {
      // Get parent's children attendance
      const children = await prisma.student.findMany({
        where: { parentId: user?.id as string },
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      });

      const childrenStats = await Promise.all(
        children.map(async (child) => {
          const childAttendance = await prisma.attendance.findMany({
            where: {
              studentId: child.id,
              date: {
                gte: today,
                lt: tomorrow,
              },
            },
          });

          const isPresent = childAttendance.some((a) => a.present);
          const isLate = childAttendance.some(
            (a) => a.present && new Date(a.date).getHours() > 8
          );

          // Get monthly stats
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthAttendance = await prisma.attendance.findMany({
            where: {
              studentId: child.id,
              date: {
                gte: monthStart,
                lt: tomorrow,
              },
            },
          });

          const monthPresent = monthAttendance.filter((a) => a.present).length;
          const monthTotal = monthAttendance.length;
          const monthlyRate =
            monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0;

          return {
            studentId: child.id,
            studentName: `${child.name} ${child.surname}`,
            className: `${child.class.grade.level}-${child.class.name}`,
            presentToday: isPresent ? 1 : 0,
            absentToday: isPresent ? 0 : 1,
            lateToday: isLate ? 1 : 0,
            monthlyAttendanceRate: monthlyRate,
          };
        })
      );

      return NextResponse.json({
        childrenStats,
      });
    } else if (role === "teacher") {
      // Get teacher's classes attendance
      const teacherClasses = await prisma.class.findMany({
        where: { supervisorId: user?.id as string },
        include: {
          grade: true,
          _count: {
            select: { students: true },
          },
        },
      });

      const teacherClassStats = await Promise.all(
        teacherClasses.map(async (classItem) => {
          const classStudents = await prisma.student.count({
            where: { classId: classItem.id },
          });

          const classAttendance = await prisma.attendance.findMany({
            where: {
              date: {
                gte: today,
                lt: tomorrow,
              },
              student: {
                classId: classItem.id,
              },
            },
          });

          const classPresent = classAttendance.filter((a) => a.present).length;
          const classAbsent = classAttendance.filter((a) => !a.present).length;
          const classLate = classAttendance.filter(
            (a) => a.present && new Date(a.date).getHours() > 8
          ).length;
          const classRate =
            classStudents > 0 ? (classPresent / classStudents) * 100 : 0;

          return {
            classId: classItem.id,
            className: classItem.name,
            gradeLevel: classItem.grade.level,
            totalStudents: classStudents,
            presentToday: classPresent,
            absentToday: classAbsent,
            lateToday: classLate,
            attendanceRate: classRate,
          };
        })
      );

      return NextResponse.json({
        teacherClassStats,
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance statistics" },
      { status: 500 }
    );
  }
}
