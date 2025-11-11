import Announcements from "@/components/Announcements";
import ModernDashboardCard from "@/components/ModernDashboardCard";
import ModernActionCard from "@/components/ModernActionCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const TeacherPageModern = async () => {
  const user = await getCurrentUser();

  // Get teacher data
  const teacher = await prisma.teacher.findUnique({
    where: { id: user?.id },
    include: {
      subjects: true,
      classes: {
        include: {
          grade: true,
          _count: { select: { students: true } },
        },
      },
      _count: {
        select: {
          lessons: true,
          classes: true,
          subjects: true,
        },
      },
    },
  });

  // Get classes where this teacher is the supervisor
  const supervisedClasses = await prisma.class.findMany({
    where: { supervisorId: user?.id },
    include: {
      grade: true,
      _count: { select: { students: true } },
    },
  });

  // Count total students across all classes
  const totalStudents =
    teacher?.classes.reduce((sum, cls) => sum + cls._count.students, 0) || 0;

  // Count supervised classes
  const supervisedClassCount = supervisedClasses?.length || 0;

  // Get upcoming lessons for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysLessons = await prisma.lesson.findMany({
    where: {
      teacherId: user?.id,
      startTime: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      subject: true,
      class: {
        include: {
          grade: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-md">
                <Image
                  src="/teacher.png"
                  alt="Teacher"
                  width={32}
                  height={32}
                  className="brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Hello, {teacher?.name}! 👋
                </h1>
                <p className="text-gray-600">
                  Ready to inspire your students today?
                </p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm text-gray-500">Today's Schedule</p>
              <p className="text-lg font-semibold text-gray-900">
                {todaysLessons.length}{" "}
                {todaysLessons.length === 1 ? "Lesson" : "Lessons"}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ModernDashboardCard
            title="My Classes"
            count={teacher?._count.classes || 0}
            icon="/class.png"
            href="/list/classes"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <ModernDashboardCard
            title="My Students"
            count={totalStudents}
            icon="/student.png"
            href="/list/students"
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <ModernDashboardCard
            title="Subjects"
            count={teacher?._count.subjects || 0}
            icon="/subject.png"
            href="/list/subjects"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <ModernDashboardCard
            title="Lessons"
            count={teacher?._count.lessons || 0}
            icon="/lesson.png"
            href="/list/lessons"
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <ModernDashboardCard
            title="Supervisor"
            count={supervisedClassCount}
            icon="/class.png"
            href="/list/classes"
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModernActionCard
              title="Take Attendance"
              description="Mark student attendance"
              icon="/attendance.png"
              href="/teacher/attendance/timetable"
              iconBgColor="bg-green-100"
            />
            <ModernActionCard
              title="View Timetable"
              description="Check your schedule"
              icon="/calendar.png"
              href="/teacher/timetable"
              iconBgColor="bg-blue-100"
            />
            <ModernActionCard
              title="Manage Assignments"
              description="Create and grade assignments"
              icon="/assignment.png"
              href="/list/assignments"
              iconBgColor="bg-purple-100"
            />
            <ModernActionCard
              title="Student Results"
              description="View and input results"
              icon="/result.png"
              href="/list/results"
              iconBgColor="bg-orange-100"
            />
            <ModernActionCard
              title="Exam Management"
              description="Schedule and manage exams"
              icon="/exam.png"
              href="/list/exams"
              iconBgColor="bg-red-100"
            />
            <ModernActionCard
              title="Messages"
              description="Communicate with everyone"
              icon="/message.png"
              href="/list/messages"
              iconBgColor="bg-indigo-100"
            />
          </div>
        </div>

        {/* Today's Lessons */}
        {todaysLessons.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Today's Lessons
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Image
                        src="/lesson.png"
                        alt=""
                        width={20}
                        height={20}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {lesson.subject.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {lesson.class.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>
                      {lesson.startTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {lesson.endTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Classes */}
        {teacher?.classes && teacher.classes.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Classes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/list/students?classId=${cls.id}`}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Image src="/class.png" alt="" width={20} height={20} />
                    </div>
                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      {cls._count.students} students
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Grade {cls.grade.level}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default TeacherPageModern;
