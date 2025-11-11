import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/class-teacher/dashboard
 * Fetch class teacher dashboard data including assigned class, students, and parents
 * Requires: teacherId query parameter
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    // Check if teacher is assigned as a class teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        img: true,
        assignedClassId: true,
        assignedClass: {
          include: {
            grade: {
              select: {
                id: true,
                level: true,
              },
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

    if (!teacher.assignedClassId || !teacher.assignedClass) {
      return NextResponse.json(
        { 
          isClassTeacher: false,
          message: "You are not assigned as a class teacher for any class" 
        },
        { status: 200 }
      );
    }

    // Fetch students in the class with their parent information
    const students = await prisma.student.findMany({
      where: {
        classId: teacher.assignedClassId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get attendance statistics for the class
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceToday = await prisma.attendance.findMany({
      where: {
        classId: teacher.assignedClassId,
        date: {
          gte: today,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Calculate attendance summary
    const totalStudents = students.length;
    const presentToday = attendanceToday.filter(a => a.present).length;
    const absentToday = attendanceToday.filter(a => !a.present).length;

    // Get recent announcements for this class
    const recentAnnouncements = await prisma.classAnnouncement.findMany({
      where: {
        classId: teacher.assignedClassId,
        isPublished: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get upcoming meetings
    const upcomingMeetings = await prisma.parentMeeting.findMany({
      where: {
        teacherId: teacher.id,
        scheduledDate: {
          gte: new Date(),
        },
        status: {
          in: ["SCHEDULED", "RESCHEDULED"],
        },
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            phone: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
      take: 10,
    });

    // Get unread messages count
    const unreadMessagesCount = await prisma.classTeacherMessage.count({
      where: {
        senderId: teacher.id,
        isRead: false,
      },
    });

    // Prepare response data
    const dashboardData = {
      isClassTeacher: true,
      teacher: {
        id: teacher.id,
        name: `${teacher.name} ${teacher.surname}`,
        email: teacher.email,
        phone: teacher.phone,
        img: teacher.img,
      },
      class: {
        id: teacher.assignedClass.id,
        name: teacher.assignedClass.name,
        capacity: teacher.assignedClass.capacity,
        grade: {
          id: teacher.assignedClass.grade.id,
          level: teacher.assignedClass.grade.level,
        },
      },
      students: students.map(student => ({
        id: student.id,
        username: student.username,
        name: student.name,
        surname: student.surname,
        fullName: `${student.name} ${student.surname}`,
        email: student.email,
        phone: student.phone,
        address: student.address,
        img: student.img,
        sex: student.sex,
        birthday: student.birthday,
        bloodType: student.bloodType,
        parent: {
          id: student.parent.id,
          name: student.parent.name,
          surname: student.parent.surname,
          fullName: `${student.parent.name} ${student.parent.surname}`,
          email: student.parent.email,
          phone: student.parent.phone,
          address: student.parent.address,
        },
      })),
      attendance: {
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate: totalStudents > 0 
          ? ((presentToday / totalStudents) * 100).toFixed(1) 
          : "0",
      },
      recentAnnouncements: recentAnnouncements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        audience: announcement.audience,
        createdAt: announcement.createdAt,
      })),
      upcomingMeetings: upcomingMeetings.map(meeting => ({
        id: meeting.id,
        scheduledDate: meeting.scheduledDate,
        meetingType: meeting.meetingType,
        status: meeting.status,
        purpose: meeting.purpose,
        parent: {
          id: meeting.parent.id,
          name: `${meeting.parent.name} ${meeting.parent.surname}`,
          phone: meeting.parent.phone,
        },
        student: meeting.student ? {
          id: meeting.student.id,
          name: `${meeting.student.name} ${meeting.student.surname}`,
        } : null,
      })),
      unreadMessagesCount,
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error("Error fetching class teacher dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
